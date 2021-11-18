'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var module$1 = require('module');
var url = require('url');
var path = require('path');
var fs$1 = _interopDefault(require('fs'));
var os = require('os');
var index_js = require('ordered-binary/index.js');
var EventEmitter = _interopDefault(require('events'));
var index_js$1 = require('weak-lru-cache/index.js');
var msgpackr = require('msgpackr');

let Env, Compression, Cursor, getAddress, getAddressShared, require$1, arch, fs;
function setNativeFunctions(nativeInterface) {
	Env = nativeInterface.Env;
	Compression = nativeInterface.Compression;
	getAddress = nativeInterface.getAddress;
    getAddressShared = nativeInterface.getAddressShared;
    Cursor = nativeInterface.Cursor;
    require$1 = nativeInterface.require;
    arch = nativeInterface.arch;
    fs = nativeInterface.fs;
}

function when(promise, callback, errback) {
  if (promise && promise.then) {
    return errback ?
      promise.then(callback, errback) :
      promise.then(callback)
  }
  return callback(promise)
}

var backpressureArray;

const MAX_KEY_SIZE = 1978;
const WAITING_OPERATION = 0x2000000;
const BACKPRESSURE_THRESHOLD = 50000;
const TXN_DELIMITER = 0x8000000;
const TXN_COMMITTED = 0x10000000;
const TXN_FLUSHED = 0x20000000;
const TXN_FAILED = 0x40000000;
const FAILED_CONDITION = 0x4000000;
const REUSE_BUFFER_MODE = 1000;

const SYNC_PROMISE_SUCCESS = Promise.resolve(true);
const SYNC_PROMISE_FAIL = Promise.resolve(false);
const ABORT = {};
const CALLBACK_THREW = {};
SYNC_PROMISE_SUCCESS.isSync = true;
SYNC_PROMISE_FAIL.isSync = true;
const ByteArray = typeof Buffer != 'undefined' ? Buffer.from : Uint8Array;
function addWriteMethods(LMDBStore, { env, fixedBuffer, resetReadTxn, useWritemap, binaryBuffer,
	eventTurnBatching, txnStartThreshold, batchStartThreshold, overlappingSync, commitDelay, separateFlushed }) {
	//  stands for write instructions
	var dynamicBytes;
	function allocateInstructionBuffer() {
		let buffer = new SharedArrayBuffer(0x10000); // Must use a shared buffer to ensure GC doesn't move it around
		dynamicBytes = new ByteArray(buffer);
		let uint32 = dynamicBytes.uint32 = new Uint32Array(buffer, 0, 0x10000 >> 2);
		uint32[0] = 0;
		dynamicBytes.float64 = new Float64Array(buffer, 0, 0x10000 >> 3);
		buffer.address = getAddressShared(buffer);
		uint32.address = buffer.address + uint32.byteOffset;
		dynamicBytes.position = 0;
		return dynamicBytes
	}
	var outstandingWriteCount = 0;
	var startAddress = 0;
	var writeTxn = null;
	var abortedNonChildTransactionWarn;
	var nextTxnCallbacks = [];
	var commitPromise, flushPromise, flushResolvers = [];
	commitDelay = commitDelay || 0;
	eventTurnBatching = eventTurnBatching === false ? false : true;
	var enqueuedCommit;
	var afterCommitCallbacks = [];
	var beforeCommitCallbacks = [];
	var enqueuedEventTurnBatch;
	if (separateFlushed === undefined)
		separateFlushed = overlappingSync;
	var batchDepth = 0;
	var writeBatchStart, outstandingBatchCount;
	txnStartThreshold = txnStartThreshold || 5;
	batchStartThreshold = batchStartThreshold || 1000;

	allocateInstructionBuffer();
	dynamicBytes.uint32[0] = TXN_DELIMITER | TXN_COMMITTED | TXN_FLUSHED;
	var txnResolution, lastQueuedResolution, nextResolution = { uint32: dynamicBytes.uint32, flagPosition: 0, };
	var uncommittedResolution = { next: nextResolution };
	var unwrittenResolution = nextResolution;
	function writeInstructions(flags, store, key, value, version, ifVersion) {
		let writeStatus;
		let targetBytes, position;
		let valueBuffer, valueSize, valueBufferStart;
		if (flags & 2) {
			// encode first in case we have to write a shared structure
			let encoder = store.encoder;
			if (value && value[binaryBuffer])
				valueBuffer = value[binaryBuffer];
			else if (encoder) {
				if (encoder.copyBuffers) // use this as indicator for support buffer reuse for now
					valueBuffer = encoder.encode(value, REUSE_BUFFER_MODE);
				else { // various other encoders, including JSON.stringify, that might serialize to a string
					valueBuffer = encoder.encode(value);
					if (typeof valueBuffer == 'string')
						valueBuffer = Buffer.from(valueBuffer); // TODO: Would be nice to write strings inline in the instructions
				}
			} else if (typeof value == 'string') {
				valueBuffer = Buffer.from(value); // TODO: Would be nice to write strings inline in the instructions
			} else if (value instanceof Uint8Array)
				valueBuffer = value;
			else
				throw new Error('Invalid value to put in database ' + value + ' (' + (typeof value) +'), consider using encoder')
			valueBufferStart = valueBuffer.start;
			if (valueBufferStart > -1) // if we have buffers with start/end position
				valueSize = valueBuffer.end - valueBufferStart; // size
			else
				valueSize = valueBuffer.length;
			if (store.dupSort && valueSize > MAX_KEY_SIZE)
				throw new Error('The value is larger than the maximum size (' + MAX_KEY_SIZE + ') for a value in a dupSort database')
		} else
			valueSize = 0;
		if (writeTxn) {
			targetBytes = fixedBuffer;
			position = 0;
		} else {
			if (eventTurnBatching && !enqueuedEventTurnBatch && batchDepth == 0) {
				enqueuedEventTurnBatch = setImmediate(() => {
					try {
						for (let i = 0, l = beforeCommitCallbacks.length; i < l; i++) {
							beforeCommitCallbacks[i]();
						}
					} catch(error) {
						console.error(error);
					}
					enqueuedEventTurnBatch = null;
					//console.log('ending event turn')
					batchDepth--;
					finishBatch();
					if (writeBatchStart)
						writeBatchStart(); // TODO: When we support delay start of batch, optionally don't delay this
				});
				commitPromise = null; // reset the commit promise, can't know if it is really a new transaction prior to finishWrite being called
				flushPromise = null;
				writeBatchStart = writeInstructions(1, store);
				outstandingBatchCount = 0;
				batchDepth++;
			}
			targetBytes = dynamicBytes;
			position = targetBytes.position;
		}
		let uint32 = targetBytes.uint32, float64 = targetBytes.float64;
		let flagPosition = position << 1; // flagPosition is the 32-bit word starting position

		// don't increment position until we are sure we don't have any key writing errors
		if (!uint32) {
			throw new Error('Internal buffers have been corrupted')
		}
		uint32[flagPosition + 1] = store.db.dbi;
		if (flags & 4) {
			let keyStartPosition = (position << 3) + 12;
			let endPosition;
			try {
				endPosition = store.writeKey(key, targetBytes, keyStartPosition);
			} catch(error) {
				targetBytes.fill(0, keyStartPosition);
				throw error
			}
			let keySize = endPosition - keyStartPosition;
			if (keySize > MAX_KEY_SIZE) {
				targetBytes.fill(0, keyStartPosition); // restore zeros
				throw new Error('Key size is larger than the maximum key size (' + MAX_KEY_SIZE + ')')
			}
			uint32[flagPosition + 2] = keySize;
			position = (endPosition + 16) >> 3;
			if (flags & 2) {
				let mustCompress;
				if (valueBufferStart > -1) { // if we have buffers with start/end position
					// record pointer to value buffer
					float64[position] = (valueBuffer.address ||
						(valueBuffer.address = getAddressShared(valueBuffer.buffer) + valueBuffer.byteOffset)) + valueBufferStart;
					mustCompress = valueBuffer[valueBufferStart] >= 254; // this is the compression indicator, so we must compress
				} else {
					let valueArrayBuffer = valueBuffer.buffer;
					// record pointer to value buffer
					float64[position] = (valueArrayBuffer.address ||
						(valueArrayBuffer.address = getAddressShared(valueArrayBuffer))) + valueBuffer.byteOffset;
					mustCompress = valueBuffer[0] >= 254; // this is the compression indicator, so we must compress
				}
				uint32[(position++ << 1) - 1] = valueSize;
				if (store.compression && (valueSize >= store.compression.threshold || mustCompress)) {
					flags |= 0x100000;
					float64[position] = store.compression.address;
					if (!writeTxn)
						env.compress(uint32.address + (position << 3), () => {
							// this is never actually called, just use to pin the buffer in memory until it is finished
							console.log(float64);
						});
					position++;
				}
			}
			if (ifVersion !== undefined) {
				if (ifVersion === null)
					flags |= 0x10;
				else {
					flags |= 0x100;
					float64[position++] = ifVersion;
				}
			}
			if (version !== undefined) {
				flags |= 0x200;
				float64[position++] = version || 0;
			}
		} else
			position++;
		targetBytes.position = position;
		//console.log('js write', (targetBytes.buffer.address + (flagPosition << 2)).toString(16), flags.toString(16))
		if (writeTxn) {
			uint32[0] = flags;
			env.write(uint32.address);
			return () => (uint32[0] & FAILED_CONDITION) ? SYNC_PROMISE_FAIL : SYNC_PROMISE_SUCCESS
		}
		// if we ever use buffers that haven't been zero'ed, need to clear out the next slot like this:
		// uint32[position << 1] = 0 // clear out the next slot
		let nextUint32;
		if (position > 0x1e00) { // 61440 bytes
			// make new buffer and make pointer to it
			let lastPosition = position;
			targetBytes = allocateInstructionBuffer();
			position = targetBytes.position;
			float64[lastPosition + 1] = targetBytes.uint32.address + position;
			uint32[lastPosition << 1] = 3; // pointer instruction
			//console.log('pointer from ', (lastFloat64.buffer.address + (lastPosition << 3)).toString(16), 'to', (targetBytes.buffer.address + position).toString(16), 'flag position', (uint32.buffer.address + (flagPosition << 2)).toString(16))
			nextUint32 = targetBytes.uint32;
		} else
			nextUint32 = uint32;
		let resolution = nextResolution;
		// create the placeholder next resolution
		nextResolution = resolution.next = store.cache ?
		{
			uint32: nextUint32,
			flagPosition: position << 1,
			flag: 0, // TODO: eventually eliminate this, as we can probably signify success by zeroing the flagPosition
			valueBuffer: fixedBuffer, // these are all just placeholders so that we have the right hidden class initially allocated
			next: null,
			key,
			store,
			valueSize,
		} :
		{
			uint32: nextUint32,
			flagPosition: position << 1,
			flag: 0, // TODO: eventually eliminate this, as we can probably signify success by zeroing the flagPosition
			valueBuffer: fixedBuffer, // these are all just placeholders so that we have the right hidden class initially allocated
			next: null,
		};
		let writtenBatchDepth = batchDepth;

		return (callback) => {
			if (writtenBatchDepth) {
				// if we are in a batch, the transaction can't close, so we do the faster,
				// but non-deterministic updates, knowing that the write thread can
				// just poll for the status change if we miss a status update
				writeStatus = uint32[flagPosition];
				uint32[flagPosition] = flags;
				//writeStatus = Atomics.or(uint32, flagPosition, flags)
				if (writeBatchStart && !writeStatus) {
					outstandingBatchCount += 1 + (valueSize >> 12);
					//console.log(outstandingBatchCount, batchStartThreshold)
					if (outstandingBatchCount > batchStartThreshold) {
						outstandingBatchCount = 0;
						writeBatchStart();
						writeBatchStart = null;
					}
				}
			} else // otherwise the transaction could end at any time and we need to know the
				// deterministically if it is ending, so we can reset the commit promise
				// so we use the slower atomic operation
				writeStatus = Atomics.or(uint32, flagPosition, flags);
	
			outstandingWriteCount++;
			if (writeStatus & TXN_DELIMITER) {
				//console.warn('Got TXN delimiter', ( uint32.address + (flagPosition << 2)).toString(16))
				commitPromise = null; // TODO: Don't reset these if this comes from the batch start operation on an event turn batch
				flushPromise = null;
				queueCommitResolution(resolution);
				if (!startAddress) {
					startAddress = uint32.address + (flagPosition << 2);
				}
			}
			if (!flushPromise && overlappingSync && separateFlushed)
				flushPromise = new Promise(resolve => flushResolvers.push(resolve));
			if (writeStatus & WAITING_OPERATION) { // write thread is waiting
				//console.log('resume batch thread', uint32.buffer.address + (flagPosition << 2))
				env.write(0);
			}
			if (outstandingWriteCount > BACKPRESSURE_THRESHOLD) {
				if (!backpressureArray)
					backpressureArray = new Int32Array(new SharedArrayBuffer(4), 0, 1);
				Atomics.wait(backpressureArray, 0, 0, Math.round(outstandingWriteCount / BACKPRESSURE_THRESHOLD));
			}
			if (startAddress) {
				if (eventTurnBatching)
					startWriting(); // start writing immediately because this has already been batched/queued
				else if (!enqueuedCommit && txnStartThreshold) {
					enqueuedCommit = commitDelay == 0 ? setImmediate(() => startWriting()) : setTimeout(() => startWriting(), commitDelay);
				} else if (outstandingWriteCount > txnStartThreshold)
					startWriting();
			}

			if ((outstandingWriteCount & 7) === 0)
				resolveWrites();
			
			if (store.cache) {
				resolution.key = key;
				resolution.store = store;
				resolution.valueSize = valueBuffer ? valueBuffer.length : 0;
			}
			resolution.valueBuffer = valueBuffer;
			lastQueuedResolution = resolution;

			if (callback) {
				resolution.reject = callback;
				resolution.resolve = (value) => callback(null, value);
				return
			}
			if (ifVersion === undefined) {
				if (writtenBatchDepth > 1)
					return SYNC_PROMISE_SUCCESS // or return undefined?
				if (!commitPromise) {
					commitPromise = new Promise((resolve, reject) => {
						resolution.resolve = resolve;
						resolution.reject = reject;
					});
					if (separateFlushed)
						commitPromise.flushed = overlappingSync ? flushPromise : commitPromise;
				}
				return commitPromise
			}
			let promise = new Promise((resolve, reject) => {
				resolution.resolve = resolve;
				resolution.reject = reject;
			});
			if (separateFlushed)
				promise.flushed = overlappingSync ? flushPromise : promise;
			return promise
		}
	}
	function startWriting() {
		//console.log('start address ' + startAddress.toString(16), store.name)
		if (enqueuedCommit) {
			clearImmediate(enqueuedCommit);
			enqueuedCommit = null;
		}
		let resolvers = flushResolvers;
		flushResolvers = [];
		env.startWriting(startAddress, (status) => {
			//console.log('finished batch', store.name)
			if (dynamicBytes.uint32[dynamicBytes.position << 1] & TXN_DELIMITER)
				queueCommitResolution(nextResolution);

			resolveWrites(true);
			switch (status) {
				case 0:
					for (let i = 0; i < resolvers.length; i++)
						resolvers[i]();
				case 1:
				break;
				case 2:
					executeTxnCallbacks();
				break
				default:
				console.error(status);
				if (commitRejectPromise) {
					commitRejectPromise.reject(status);
					commitRejectPromise = null;
				}
			}
		});
		startAddress = 0;
	}

	function queueCommitResolution(resolution) {
		if (!resolution.isTxn) {
			resolution.isTxn = true;
			if (txnResolution) {
				txnResolution.nextTxn = resolution;
				//outstandingWriteCount = 0
			}
			else
				txnResolution = resolution;
		}
	}
	var TXN_DONE = (separateFlushed ? TXN_COMMITTED : TXN_FLUSHED) | TXN_FAILED;
	function resolveWrites(async) {
		// clean up finished instructions
		let instructionStatus;
		while ((instructionStatus = unwrittenResolution.uint32[unwrittenResolution.flagPosition])
				& 0x1000000) {
			//console.log('instructionStatus: ' + instructionStatus.toString(16))
			if (unwrittenResolution.callbacks) {
				nextTxnCallbacks.push(unwrittenResolution.callbacks);
				unwrittenResolution.callbacks = null;
			}
			if (!unwrittenResolution.isTxn)
				unwrittenResolution.uint32 = null;
			unwrittenResolution.valueBuffer = null;
			unwrittenResolution.flag = instructionStatus;
			outstandingWriteCount--;
			unwrittenResolution = unwrittenResolution.next;
		}
		while (txnResolution &&
			(instructionStatus = txnResolution.uint32[txnResolution.flagPosition] & TXN_DONE)) {
			if (instructionStatus & TXN_FAILED)
				rejectCommit();
			else
				resolveCommit(async);
		}
	}

	function resolveCommit(async) {
		afterCommit();
		if (async)
			resetReadTxn();
		else
			queueMicrotask(resetReadTxn); // TODO: only do this if there are actually committed writes?
		do {
			if (uncommittedResolution.resolve) {
				let flag = uncommittedResolution.flag;
				if (flag < 0)
					uncommittedResolution.reject(new Error("Error occurred in write"));
				else if (flag & FAILED_CONDITION) {
					uncommittedResolution.resolve(false);
				} else
					uncommittedResolution.resolve(true);
			}
		} while((uncommittedResolution = uncommittedResolution.next) && uncommittedResolution != txnResolution)
		txnResolution = txnResolution.nextTxn;
	}
	var commitRejectPromise;
	function rejectCommit() {
		afterCommit();
		if (!commitRejectPromise) {
			let rejectFunction;
			commitRejectPromise = new Promise((resolve, reject) => rejectFunction = reject);
			commitRejectPromise.reject = rejectFunction;
		}
		do {
			if (uncommittedResolution.reject) {
				let flag = uncommittedResolution.flag & 0xf;
				let error = new Error("Commit failed (see commitError for details)");
				error.commitError = commitRejectPromise;
				uncommittedResolution.reject(error);
			}
		} while((uncommittedResolution = uncommittedResolution.next) && uncommittedResolution != txnResolution)
		txnResolution = txnResolution.nextTxn;
	}
	function atomicStatus(uint32, flagPosition, newStatus) {
		if (batchDepth) {
			// if we are in a batch, the transaction can't close, so we do the faster,
			// but non-deterministic updates, knowing that the write thread can
			// just poll for the status change if we miss a status update
			let writeStatus = uint32[flagPosition];
			uint32[flagPosition] = newStatus;
			return writeStatus
			//return Atomics.or(uint32, flagPosition, newStatus)
		} else // otherwise the transaction could end at any time and we need to know the
			// deterministically if it is ending, so we can reset the commit promise
			// so we use the slower atomic operation
			return Atomics.or(uint32, flagPosition, newStatus)
	}
	function afterCommit() {
		for (let i = 0, l = afterCommitCallbacks.length; i < l; i++) {
			afterCommitCallbacks[i]({ next: uncommittedResolution, last: unwrittenResolution});
		}
	}
	async function executeTxnCallbacks() {
		env.writeTxn = writeTxn = {};
		let promises;
		let txnCallbacks;
		for (let i = 0, l = nextTxnCallbacks.length; i < l; i++) {
			txnCallbacks = nextTxnCallbacks[i];
			for (let i = 0, l = txnCallbacks.length; i < l; i++) {
				let userTxnCallback = txnCallbacks[i];
				let asChild = userTxnCallback.asChild;
				if (asChild) {
					if (promises) {
						// must complete any outstanding transactions before proceeding
						await Promise.all(promises);
						promises = null;
					}
					env.beginTxn(1); // abortable
					
					try {
						let result = userTxnCallback.callback();
						if (result && result.then) {
							await result;
						}
						if (result === ABORT)
							env.abortTxn();
						else
							env.commitTxn();
							txnCallbacks[i] = result;
					} catch(error) {
						env.abortTxn();
						txnError(error, i);
					}
				} else {
					try {
						let result = userTxnCallback();
						txnCallbacks[i] = result;
						if (result && result.then) {
							if (!promises)
								promises = [];
							promises.push(result.catch(() => {}));
						}
					} catch(error) {
						txnError(error, i);
					}
				}
			}
		}
		nextTxnCallbacks = [];
		if (promises) { // finish any outstanding commit functions
			await Promise.all(promises);
		}
		env.writeTxn = writeTxn = false;
		function txnError(error, i) {
			(txnCallbacks.errors || (txnCallbacks.errors = []))[i] = error;
			txnCallbacks[i] = CALLBACK_THREW;
		}
	}
	function finishBatch() {
		dynamicBytes.uint32[(dynamicBytes.position + 1) << 1] = 0; // clear out the next slot
		let writeStatus = atomicStatus(dynamicBytes.uint32, (dynamicBytes.position++) << 1, 2); // atomically write the end block
		nextResolution.flagPosition += 2;
		if (writeStatus & WAITING_OPERATION) {
			env.write(0);
		}
	}
	Object.assign(LMDBStore.prototype, {
		put(key, value, versionOrOptions, ifVersion) {
			let callback, flags = 15, type = typeof versionOrOptions;
			if (type == 'object') {
				if (versionOrOptions.noOverwrite)
					flags |= 0x10;
				if (versionOrOptions.noDupData)
					flags |= 0x20;
				if (versionOrOptions.append)
					flags |= 0x20000;
				if (versionOrOptions.ifVersion != undefined)
					ifVersion = versionsOrOptions.ifVersion;
				versionOrOptions = versionOrOptions.version;
				if (typeof ifVersion == 'function')
					callback = ifVersion;
			} else if (type == 'function') {
				callback = versionOrOptions;
			}
			return writeInstructions(flags, this, key, value, this.useVersions ? versionOrOptions || 0 : undefined, ifVersion)(callback)
		},
		remove(key, ifVersionOrValue, callback) {
			let flags = 13;
			let ifVersion, value;
			if (ifVersionOrValue !== undefined) {
				if (typeof ifVersionOrValue == 'function')
					callback = ifVersionOrValue;
				else if (this.useVersions)
					ifVersion = ifVersionOrValue;
				else {
					flags = 14;
					value = ifVersionOrValue;
				}
			}
			return writeInstructions(flags, this, key, value, undefined, ifVersion)(callback)
		},
		del(key, options, callback) {
			return this.remove(key, options, callback)
		},
		ifNoExists(key, callback) {
			return this.ifVersion(key, null, callback)
		},

		ifVersion(key, version, callback) {
			if (!callback) {
				return new Batch((operations, callback) => {
					let promise = this.ifVersion(key, version, operations);
					if (callback)
						promise.then(callback);
					return promise
				})
			}
			if (writeTxn) {
				if (this.doesExist(key, version)) {
					callback();
					return SYNC_PROMISE_SUCCESS
				}
				return SYNC_PROMISE_FAIL
			}
			let finishStartWrite = writeInstructions(typeof key === 'undefined' ? 1 : 4, this, key, undefined, undefined, version);
			let promise;
			batchDepth += 2;
			if (batchDepth > 2)
				promise = finishStartWrite();
			else {
				writeBatchStart = () => {
					promise = finishStartWrite();
				};
				outstandingBatchCount = 0;
			}
			//console.warn('wrote start of ifVersion', this.path)
			try {
				if (typeof callback === 'function') {
					callback();
				} else {
					for (let i = 0, l = callback.length; i < l; i++) {
						let operation = callback[i];
						this[operation.type](operation.key, operation.value);
					}
				}
			} finally {
				//console.warn('writing end of ifVersion', this.path, (dynamicBytes.buffer.address + ((dynamicBytes.position + 1) << 3)).toString(16))
				if (!promise) {
					finishBatch();
					batchDepth -= 2;
					promise = finishStartWrite(); // finish write once all the operations have been written (and it hasn't been written prematurely)
					writeBatchStart = null;
				} else {
					batchDepth -= 2;
					finishBatch();
				}
			}
			return promise
		},
		batch(callbackOrOperations) {
			return this.ifVersion(undefined, undefined, callbackOrOperations)
		},
		drop(callback) {
			return writeInstructions(1024 + 12, this, undefined, undefined, undefined, undefined)(callback)
		},
		clearAsync(callback) {
			if (this.encoder && this.encoder.structures)
				this.encoder.structures = [];
			return writeInstructions(12, this, undefined, undefined, undefined, undefined)(callback)
		},
		_triggerError() {
			finishBatch();
		},

		putSync(key, value, versionOrOptions, ifVersion) {
			if (writeTxn)
				return this.put(key, value, versionOrOptions, ifVersion)
			else
				return this.transactionSync(() =>
					this.put(key, value, versionOrOptions, ifVersion) == SYNC_PROMISE_SUCCESS,
					{ abortable: false })
		},
		removeSync(key, ifVersionOrValue) {
			if (writeTxn)
				return this.remove(key, ifVersionOrValue)
			else
				return this.transactionSync(() =>
					this.remove(key, ifVersionOrValue) == SYNC_PROMISE_SUCCESS,
					{ abortable: false })
		},
		transaction(callback) {
			if (writeTxn) {
				// already nested in a transaction, just execute and return
				return callback()
			}
			return this.transactionAsync(callback)
		},
		childTransaction(callback) {
			if (useWritemap)
				throw new Error('Child transactions are not supported in writemap mode')
			if (writeTxn) {
				env.beginTxn(1); // abortable
				try {
					return when(callback(), (result) => {
						if (result === ABORT)
							env.abortTxn();
						else
							env.commitTxn();
						return result
					}, (error) => {
						env.abortTxn();
						throw error
					})
				} catch(error) {
					env.abortTxn();
					throw error
				}
			}
			return this.transactionAsync(callback, true)
		},
		transactionAsync(callback, asChild) {
			let txnIndex;
			let txnCallbacks;
			if (!nextResolution.callbacks) {
				txnCallbacks = [asChild ? { callback, asChild } : callback];
				nextResolution.callbacks = txnCallbacks;
				txnCallbacks.results = writeInstructions(8 | (this.strictAsyncOrder ? 0x100000 : 0), this)();
				txnIndex = 0;
			} else {
				txnCallbacks = lastQueuedResolution.callbacks;
				txnIndex = txnCallbacks.push(asChild ? { callback, asChild } : callback) - 1;
			}
			return txnCallbacks.results.then((results) => {
				let result = txnCallbacks[txnIndex];
				if (result === CALLBACK_THREW)
					throw txnCallbacks.errors[txnIndex]
				return result
			})
		},
		transactionSync(callback, flags) {
			if (writeTxn) {
				if (!useWritemap && !this.cache)
					// already nested in a transaction, execute as child transaction (if possible) and return
					return this.childTransaction(callback)
				let result = callback(); // else just run in current transaction
				if (result == ABORT && !abortedNonChildTransactionWarn) {
					console.warn('Can not abort a transaction inside another transaction with ' + (this.cache ? 'caching enabled' : 'useWritemap enabled'));
					abortedNonChildTransactionWarn = true;
				}
				return result
			}
			try {
				this.transactions++;
				env.beginTxn(flags == undefined ? 3 : flags);
				writeTxn = env.writeTxn = {};
				return when(callback(), (result) => {
					try {
						if (result === ABORT)
							env.abortTxn();
						else {
							env.commitTxn();
							resetReadTxn();
						}
						return result
					} finally {
						env.writeTxn = writeTxn = null;
					}
				}, (error) => {
					try { env.abortTxn(); } catch(e) {}
					env.writeTxn = writeTxn = null;
					throw error
				})
			} catch(error) {
				try { env.abortTxn(); } catch(e) {}
				env.writeTxn = writeTxn = null;
				throw error
			}
		},
		transactionSyncStart(callback) {
			return this.transactionSync(callback, 0)
		},
		on(event, callback) {
			if (event == 'beforecommit') {
				eventTurnBatching = true;
				beforeCommitCallbacks.push(callback);
			} else if (event == 'aftercommit')
				afterCommitCallbacks.push(callback);
		}
	});
	LMDBStore.prototype.del = LMDBStore.prototype.remove;
}

class Batch extends Array {
	constructor(callback) {
		super();
		this.callback = callback;
	}
	put(key, value) {
		this.push({ type: 'put', key, value });
	}
	del(key) {
		this.push({ type: 'del', key });
	}
	clear() {
		this.splice(0, this.length);
	}
	write(callback) {
		return this.callback(this, callback)
	}
}

function levelup(store) {
	return Object.assign(Object.create(store), {
		get(key, options, callback) {
			let result = store.get(key);
			if (typeof options == 'function')
				callback = options;
			if (callback) {
				if (result === undefined)
					callback(new NotFoundError());
				else
					callback(null, result);
			} else {
				if (result === undefined)
					return Promise.reject(new NotFoundError())
				else
					return Promise.resolve(result)
			}
		},
	})
}
class NotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NotFoundError';
		this.notFound = true;
	}
}

let getLastVersion;
const mapGet = Map.prototype.get;
const CachingStore = Store => class extends Store {
	constructor(dbName, options) {
		super(dbName, options);
		if (!this.env.cacheCommitter) {
			this.env.cacheCommitter = true;
			this.on('aftercommit', ({ next, last }) => {
				do {
					let store = next.store;
					if (store) {
						if (next.flag & 1)
							next.store.cache.delete(next.key); // just delete it from the map
						else {
							let expirationPriority = next.valueSize >> 10;
							let cache = next.store.cache;
							let entry = mapGet.call(cache, next.key);
							if (entry)
								cache.used(entry, expirationPriority); // this will enter it into the LRFU
						}
					}
				} while (next != last && (next = next.next))
			});
		}
		this.db.cachingDb = this;
		this.cache = new index_js$1.WeakLRUCache(options.cache);
	}
	get(id, cacheMode) {
		let value = this.cache.getValue(id);
		if (value !== undefined)
			return value
		value = super.get(id);
		if (value && typeof value === 'object' && !cacheMode && typeof id !== 'object') {
			let entry = this.cache.setValue(id, value, this.lastSize >> 10);
			if (this.useVersions) {
				entry.version = getLastVersion();
			}
		}
		return value
	}
	getEntry(id, cacheMode) {
		let entry = this.cache.get(id);
		if (entry)
			return entry
		let value = super.get(id);
		if (value === undefined)
			return
		if (value && typeof value === 'object' && !cacheMode && typeof id !== 'object') {
			entry = this.cache.setValue(id, value, this.lastSize >> 10);
		} else {
			entry = { value };
		}
		if (this.useVersions) {
			entry.version = getLastVersion();
		}
		return entry
	}
	putEntry(id, entry, ifVersion) {
		let result = super.put(id, entry.value, entry.version, ifVersion);
		if (typeof id === 'object')
			return result
		if (result && result.then)
			this.cache.setManually(id, entry); // set manually so we can keep it pinned in memory until it is committed
		else // sync operation, immediately add to cache
			this.cache.set(id, entry);
	}
	put(id, value, version, ifVersion) {
		// if (this.cache.get(id)) // if there is a cache entry, remove it from scheduledEntries and 
		let result = super.put(id, value, version, ifVersion);
		if (typeof id !== 'object') {
			// sync operation, immediately add to cache, otherwise keep it pinned in memory until it is committed
			let entry = this.cache.setValue(id, value, !result || result.isSync ? 0 : -1);
			if (version !== undefined)
				entry.version = typeof version === 'object' ? version.version : version;
		}
		return result
	}
	putSync(id, value, version, ifVersion) {
		if (id !== 'object') {
			// sync operation, immediately add to cache, otherwise keep it pinned in memory until it is committed
			if (value && typeof value === 'object') {
				let entry = this.cache.setValue(id, value);
				if (version !== undefined) {
					entry.version = typeof version === 'object' ? version.version : version;
				}
			} else // it is possible that  a value used to exist here
				this.cache.delete(id);
		}
		return super.putSync(id, value, version, ifVersion)
	}
	remove(id, ifVersion) {
		this.cache.delete(id);
		return super.remove(id, ifVersion)
	}
	removeSync(id, ifVersion) {
		this.cache.delete(id);
		return super.removeSync(id, ifVersion)
	}
	clear() {
		this.cache.clear();
		super.clear();
	}
	childTransaction(execute) {
		throw new Error('Child transactions are not supported in caching stores')
	}
};
function setGetLastVersion(get) {
	getLastVersion = get;
}

const SKIP = {};
if (!Symbol.asyncIterator) {
	Symbol.asyncIterator = Symbol.for('Symbol.asyncIterator');
}

class ArrayLikeIterable {
	constructor(sourceArray) {
		if (sourceArray) {
			this[Symbol.iterator] = sourceArray[Symbol.iterator].bind(sourceArray);
		}
	}
	map(func) {
		let source = this;
		let result = new ArrayLikeIterable();
		result[Symbol.iterator] = (async) => {
			let iterator = source[Symbol.iterator](async);
			return {
				next(resolvedResult) {
					let result;
					do {
						let iteratorResult;
						if (resolvedResult) {
							iteratorResult = resolvedResult;
							resolvedResult = null; // don't go in this branch on next iteration
						} else {
							iteratorResult = iterator.next();
							if (iteratorResult.then) {
								return iteratorResult.then(iteratorResult => this.next(iteratorResult))
							}
						}
						if (iteratorResult.done === true) {
							this.done = true;
							return iteratorResult
						}
						result = func(iteratorResult.value);
						if (result && result.then) {
							return result.then(result =>
								result == SKIP ?
									this.next() :
									{
										value: result
									})
						}
					} while(result == SKIP)
					return {
						value: result
					}
				},
				return() {
					return iterator.return()
				},
				throw() {
					return iterator.throw()
				}
			}
		};
		return result
	}
	[Symbol.asyncIterator]() {
		return this[Symbol.iterator](true)
	}
	filter(func) {
		return this.map(element => func(element) ? element : SKIP)
	}

	forEach(callback) {
		let iterator = this[Symbol.iterator]();
		let result;
		while ((result = iterator.next()).done !== true) {
			callback(result.value);
		}
	}
	concat(secondIterable) {
		let concatIterable = new ArrayLikeIterable();
		concatIterable[Symbol.iterator] = (async) => {
			let iterator = this[Symbol.iterator]();
			let isFirst = true;
			let concatIterator = {
				next() {
					let result = iterator.next();
					if (isFirst && result.done) {
						isFirst = false;
						iterator = secondIterable[Symbol.iterator](async);
						return iterator.next()
					}
					return result
				},
				return() {
					return iterator.return()
				},
				throw() {
					return iterator.throw()
				}
			};
			return concatIterator
		};
		return concatIterable
	}
	toJSON() {
		if (this.asArray && this.asArray.forEach) {
			return this.asArray
		}
		throw new Error('Can not serialize async iteratables without first calling resolveJSON')
		//return Array.from(this)
	}
	get asArray() {
		if (this._asArray)
			return this._asArray
		let promise = new Promise((resolve, reject) => {
			let iterator = this[Symbol.iterator](true);
			let array = [];
			let iterable = this;
			function next(result) {
				while (result.done !== true) {
					if (result.then) {
						return result.then(next)
					} else {
						array.push(result.value);
					}
					result = iterator.next();
				}
				array.iterable = iterable;
				resolve(iterable._asArray = array);
			}
			next(iterator.next());
		});
		promise.iterable = this;
		return this._asArray || (this._asArray = promise)
	}
	resolveData() {
		return this.asArray
	}
}

index_js.enableNullTermination();

const writeUint32Key = (key, target, start) => {
	(target.dataView || (target.dataView = new DataView(target.buffer, 0, target.length))).setUint32(start, key, true);
	return start + 4
};
const readUint32Key = (target, start) => {
	return (target.dataView || (target.dataView = new DataView(target.buffer, 0, target.length))).getUint32(start, true)
};
const writeBufferKey = (key, target, start) => {
	if (key.length > 1978)
		throw new Error('Key buffer is too long')
	target.set(key, start);
	return key.length + start
};
const readBufferKey = (target, start, end) => {
	return Uint8ArraySlice.call(target, start, end)
};

function applyKeyHandling(store) {
 	if (store.encoding == 'ordered-binary') {
		store.encoder = store.decoder = {
			writeKey: index_js.writeKey,
			readKey: index_js.readKey,
		};
	}
	if (store.encoder && store.encoder.writeKey && !store.encoder.encode) {
		store.encoder.encode = function(value) {
			if (savePosition > 6200)
				allocateSaveBuffer();
			let start = savePosition;
			savePosition = index_js.writeKey(value, saveBuffer, start);
			saveBuffer.start = start;
			saveBuffer.end = savePosition;
			savePosition = (savePosition + 7) & 0xfffff8;
			return saveBuffer
		};
	}
	if (store.decoder && store.decoder.readKey && !store.decoder.decode)
		store.decoder.decode = function(buffer, end) { return this.readKey(buffer, 0, end) };
	if (store.keyIsUint32) {
		store.writeKey = writeUint32Key;
		store.readKey = readUint32Key;
	} else if (store.keyIsBuffer) {
		store.writeKey = writeBufferKey;
		store.readKey = readBufferKey;
	} else if (store.keyEncoder) {
		store.writeKey = store.keyEncoder.writeKey;
		store.readKey = store.keyEncoder.readKey;
	} else {
		store.writeKey = index_js.writeKey;
		store.readKey = index_js.readKey;
	}
}

let saveBuffer, saveDataView, saveDataAddress;
let savePosition = 8000;
function allocateSaveBuffer() {
	saveBuffer = Buffer.alloc(8192);
	saveBuffer.dataView = saveDataView = new DataView(saveBuffer.buffer, saveBuffer.byteOffset, saveBuffer.byteLength);
	saveBuffer.buffer.address = getAddress(saveBuffer.buffer);
	saveDataAddress = saveBuffer.buffer.address + saveBuffer.byteOffset;
	savePosition = 0;

}
function saveKey(key, writeKey, saveTo) {
	if (savePosition > 6200) {
		allocateSaveBuffer();
	}
	let start = savePosition;
	savePosition = writeKey(key, saveBuffer, start + 4);
	saveDataView.setUint32(start, savePosition - start - 4, true);
	saveTo.saveBuffer = saveBuffer;
	savePosition = (savePosition + 7) & 0xfffff8;
	return start + saveDataAddress
}

const ITERATOR_DONE = { done: true, value: undefined };

function addQueryMethods(LMDBStore, {
	getReadTxn, env, keyBytes, keyBytesView, getLastVersion
}) {
	let renewId = 1;
	LMDBStore.onReadReset = () => renewId++;
	let get = LMDBStore.prototype.get;
	Object.assign(LMDBStore.prototype, {
		getValues(key, options) {
			let defaultOptions = {
				key,
				valuesForKey: true
			};
			if (options && options.snapshot === false)
				throw new Error('Can not disable snapshots for getValues')
			return this.getRange(options ? Object.assign(defaultOptions, options) : defaultOptions)
		},
		getKeys(options) {
			if (!options)
				options = {};
			options.values = false;
			return this.getRange(options)
		},
		getCount(options) {
			if (!options)
				options = {};
			options.onlyCount = true;
			return this.getRange(options)[Symbol.iterator]()
		},
		getKeysCount(options) {
			if (!options)
				options = {};
			options.onlyCount = true;
			options.values = false;
			return this.getRange(options)[Symbol.iterator]()
		},
		getValuesCount(key, options) {
			if (!options)
				options = {};
			options.key = key;
			options.valuesForKey = true;
			options.onlyCount = true;
			return this.getRange(options)[Symbol.iterator]()
		},
		getRange(options) {
			let iterable = new ArrayLikeIterable();
			if (!options)
				options = {};
			let includeValues = options.values !== false;
			let includeVersions = options.versions;
			let valuesForKey = options.valuesForKey;
			let limit = options.limit;
			let db = this.db;
			let snapshot = options.snapshot;
			iterable[Symbol.iterator] = () => {
				let currentKey = valuesForKey ? options.key : options.start;
				const reverse = options.reverse;
				let count = 0;
				let cursor, cursorRenewId;
				let txn;
				let flags = (includeValues ? 0x100 : 0) | (reverse ? 0x400 : 0) |
					(valuesForKey ? 0x800 : 0) | (options.exactMatch ? 0x4000 : 0);
				function resetCursor() {
					try {
						if (cursor)
							finishCursor();
						let writeTxn = env.writeTxn;
						txn = writeTxn || getReadTxn();
						cursor = !writeTxn && db.availableCursor;
						if (cursor) {
							db.availableCursor = null;
							if (db.cursorTxn != txn)
								cursor.renew();
							else// if (db.currentRenewId != renewId)
								flags |= 0x2000;
						} else {
							cursor = new Cursor(db);
						}
						txn.cursorCount = (txn.cursorCount || 0) + 1; // track transaction so we always use the same one
						if (snapshot === false) {
							cursorRenewId = renewId; // use shared read transaction
							txn.renewingCursorCount = (txn.renewingCursorCount || 0) + 1; // need to know how many are renewing cursors
						}
					} catch(error) {
						if (cursor) {
							try {
								cursor.close();
							} catch(error) { }
						}
						throw error
					}
				}
				resetCursor();
				let store = this;
				if (options.onlyCount) {
					flags |= 0x1000;
					let count = position(options.offset);
					finishCursor();
					return count
				}
				function position(offset) {
					let keySize = store.writeKey(currentKey, keyBytes, 0);
					let endAddress;
					if (valuesForKey) {
						if (options.start === undefined && options.end === undefined)
							endAddress = 0;
						else {
							let startAddress;
							if (store.encoder.writeKey) {
								startAddress = saveKey(options.start, store.encoder.writeKey, iterable);
								keyBytesView.setFloat64(2000, startAddress, true);
								endAddress = saveKey(options.end, store.encoder.writeKey, iterable);
							} else if ((!options.start || options.start instanceof Uint8Array) && (!options.end || options.end instanceof Uint8Array)) {
								startAddress = saveKey(options.start, index_js.writeKey, iterable);
								keyBytesView.setFloat64(2000, startAddress, true);
								endAddress = saveKey(options.end, index_js.writeKey, iterable);
							} else {
								throw new Error('Only key-based encoding is supported for start/end values')
							}
						}
					} else
						endAddress = saveKey(options.end, store.writeKey, iterable);
					return cursor.position(flags, offset || 0, keySize, endAddress)
				}

				function finishCursor() {
					if (txn.isAborted)
						return
					if (cursorRenewId)
						txn.renewingCursorCount--;
					if (--txn.cursorCount <= 0 && txn.onlyCursor) {
						cursor.close();
						txn.abort(); // this is no longer main read txn, abort it now that we are done
						txn.isAborted = true;
					} else {
						if (db.availableCursor || txn != getReadTxn())
							cursor.close();
						else { // try to reuse it
							db.availableCursor = cursor;
							db.cursorTxn = txn;
						}
					}
				}
				return {
					next() {
						let keySize, lastSize;
						if (cursorRenewId && cursorRenewId != renewId) {
							resetCursor();
							keySize = position(0);
						}
						if (count === 0) { // && includeValues) // on first entry, get current value if we need to
							keySize = position(options.offset);
						} else
							keySize = cursor.iterate();
						if (keySize === 0 ||
								(count++ >= limit)) {
							finishCursor();
							return ITERATOR_DONE
						}
						if (!valuesForKey || snapshot === false)
							currentKey = store.readKey(keyBytes, 32, keySize + 32);
						if (includeValues) {
							let value;
							lastSize = keyBytesView.getUint32(0, true);
							if (store.decoder) {
								value = store.decoder.decode(db.unsafeBuffer, lastSize);
							} else if (store.encoding == 'binary')
								value = Uint8ArraySlice.call(db.unsafeBuffer, 0, lastSize);
							else {
								value = store.db.unsafeBuffer.toString('utf8', 0, lastSize);
								if (store.encoding == 'json' && value)
									value = JSON.parse(value);
							}
							if (includeVersions)
								return {
									value: {
										key: currentKey,
										value,
										version: getLastVersion()
									}
								}
 							else if (valuesForKey)
								return {
									value
								}
							else
								return {
									value: {
										key: currentKey,
										value,
									}
								}
						} else if (includeVersions) {
							return {
								value: {
									key: currentKey,
									version: getLastVersion()
								}
							}
						} else {
							return {
								value: currentKey
							}
						}
					},
					return() {
						finishCursor();
						return ITERATOR_DONE
					},
					throw() {
						finishCursor();
						return ITERATOR_DONE
					}
				}
			};
			return iterable
		},
		getMany(keys, callback) {
			let results = new Array(keys.length);
			for (let i = 0, l = keys.length; i < l; i++) {
				results[i] = get.call(this, keys[i]);
			}
			if (callback)
				callback(null, results);
			return Promise.resolve(results) // we may eventually make this a true async operation
		}

	});
}

const binaryBuffer = Symbol('binaryBuffer');
setGetLastVersion(getLastVersion$1);
const Uint8ArraySlice$1 = Uint8Array.prototype.slice;
let keyBytes, keyBytesView;
const DEFAULT_COMMIT_DELAY = 0;

const allDbs = new Map();
const SYNC_PROMISE_RESULT = Promise.resolve(true);
const SYNC_PROMISE_FAIL$1 = Promise.resolve(false);
SYNC_PROMISE_RESULT.isSync = true;
SYNC_PROMISE_FAIL$1.isSync = true;
let defaultCompression;
let lastSize;
function open(path$1, options) {
	if (!keyBytes)
		allocateFixedBuffer();
	let env = new Env();
	let scheduledTransactions;
	let scheduledOperations;
	let asyncTransactionAfter = true, asyncTransactionStrictOrder;
	let readTxn, readTxnRenewed;
	if (typeof path$1 == 'object' && !options) {
		options = path$1;
		path$1 = options.path;
	}
	let extension = path.extname(path$1);
	let name = path.basename(path$1, extension);
	let is32Bit = arch().endsWith('32');
	let remapChunks = (options && options.remapChunks) || ((options && options.mapSize) ?
		(is32Bit && options.mapSize > 0x100000000) : // larger than fits in address space, must use dynamic maps
		is32Bit); // without a known map size, we default to being able to handle large data correctly/well*/
	options = Object.assign({
		path: path$1,
		noSubdir: Boolean(extension),
		isRoot: true,
		maxDbs: 12,
		remapChunks,
		keyBytes,
		//overlappingSync: true,
		// default map size limit of 4 exabytes when using remapChunks, since it is not preallocated and we can
		// make it super huge.
		mapSize: remapChunks ? 0x10000000000000 :
			0x20000, // Otherwise we start small with 128KB
	}, options);
	if (options.asyncTransactionOrder == 'before') {
		console.warn('asyncTransactionOrder: "before" is deprecated');
		asyncTransactionAfter = false;
	} else if (options.asyncTransactionOrder == 'strict') {
		asyncTransactionStrictOrder = true;
		asyncTransactionAfter = false;
	}
	if (!fs.existsSync(options.noSubdir ? path.dirname(path$1) : path$1))
		fs.mkdirSync(options.noSubdir ? path.dirname(path$1) : path$1, { recursive: true });
	if (options.compression) {
		if (options.compression == true) {
			if (defaultCompression)
				options.compression = defaultCompression;
			else
				defaultCompression = options.compression = new Compression({
					threshold: 1000,
					dictionary: fs.readFileSync(new URL('./dict/dict.txt', (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('node-index.cjs', document.baseURI).href)).replace(/dist[\\\/]index.cjs$/, ''))),
				});
				defaultCompression.threshold = 1000;
		} else {
			let compressionOptions = Object.assign({
				threshold: 1000,
				dictionary: fs.readFileSync(new URL('./dict/dict.txt', (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('node-index.cjs', document.baseURI).href)).replace(/dist[\\\/]index.cjs$/, ''))),
			}, options.compression);
			options.compression = new Compression(compressionOptions);
			options.compression.threshold = compressionOptions.threshold;
		}
	}

	if (options && options.clearOnStart) {
		console.info('Removing', path$1);
		fs.removeSync(path$1);
		console.info('Removed', path$1);
	}
	env.open(options);
	env.readerCheck(); // clear out any stale entries
	function renewReadTxn() {
		if (readTxn)
			readTxn.renew();
		else
			readTxn = env.beginTxn(0x20000);
		readTxnRenewed = setImmediate(resetReadTxn);
		return readTxn
	}
	function resetReadTxn() {
		if (readTxnRenewed) {
			LMDBStore.onReadReset();
			readTxnRenewed = null;
			if (readTxn.cursorCount - (readTxn.renewingCursorCount || 0) > 0) {
				readTxn.onlyCursor = true;
				readTxn = null;
			}
			else
				readTxn.reset();
		}
	}
	class LMDBStore extends EventEmitter {
		constructor(dbName, dbOptions) {
			super();
			if (dbName === undefined)
				throw new Error('Database name must be supplied in name property (may be null for root database)')

			const openDB = () => {
				this.db = env.openDbi(Object.assign({
					name: dbName,
					create: true,
					txn: env.writeTxn,
				}, dbOptions));
				this.db.name = dbName || null;
			};
			if (dbOptions.compression && !(dbOptions.compression instanceof Compression)) {
				if (dbOptions.compression == true && options.compression)
					dbOptions.compression = options.compression; // use the parent compression if available
				else
					dbOptions.compression = new Compression(Object.assign({
						threshold: 1000,
						dictionary: fs.readFileSync(require$1.resolve('./dict/dict.txt')),
					}), dbOptions.compression);
			}

			if (dbOptions.dupSort && (dbOptions.useVersions || dbOptions.cache)) {
				throw new Error('The dupSort flag can not be combined with versions or caching')
			}
			openDB();
			resetReadTxn(); // a read transaction becomes invalid after opening another db
			this.name = dbName;
			this.status = 'open';
			this.env = env;
			this.reads = 0;
			this.writes = 0;
			this.transactions = 0;
			this.averageTransactionTime = 5;
			if (dbOptions.syncBatchThreshold)
				console.warn('syncBatchThreshold is no longer supported');
			if (dbOptions.immediateBatchThreshold)
				console.warn('immediateBatchThreshold is no longer supported');
			this.commitDelay = DEFAULT_COMMIT_DELAY;
			Object.assign(this, { // these are the options that are inherited
				path: options.path,
				encoding: options.encoding,
				strictAsyncOrder: options.strictAsyncOrder,
			}, dbOptions);
			if (!this.encoding || this.encoding == 'msgpack' || this.encoding == 'cbor') {
				this.encoder = this.decoder = new (this.encoding == 'cbor' ? require$1('cbor-x').Encoder : msgpackr.Encoder)
					(Object.assign(this.sharedStructuresKey ?
					this.setupSharedStructures() : {
						copyBuffers: true, // need to copy any embedded buffers that are found since we use unsafe buffers
					}, options, dbOptions));
			} else if (this.encoding == 'json') {
				this.encoder = {
					encode: JSON.stringify,
				};
			}
			applyKeyHandling(this);
			allDbs.set(dbName ? name + '-' + dbName : name, this);
		}
		openDB(dbName, dbOptions) {
			if (typeof dbName == 'object' && !dbOptions) {
				dbOptions = dbName;
				dbName = options.name;
			} else
				dbOptions = dbOptions || {};
			try {
				return dbOptions.cache ?
					new (CachingStore(LMDBStore))(dbName, dbOptions) :
					new LMDBStore(dbName, dbOptions)
			} catch(error) {
				if (error.message.indexOf('MDB_DBS_FULL') > -1) {
					error.message += ' (increase your maxDbs option)';
				}
				throw error
			}
		}
		open(dbOptions, callback) {
			let db = this.openDB(dbOptions);
			if (callback)
				callback(null, db);
			return db
		}
		transactionAsync(callback, asChild) {
			let lastOperation;
			if (scheduledOperations) {
				lastOperation = asyncTransactionAfter ? scheduledOperations.appendAsyncTxn :
					scheduledOperations[asyncTransactionStrictOrder ? scheduledOperations.length - 1 : 0];
			} else {
				scheduledOperations = [];
				scheduledOperations.bytes = 0;
			}
			let transactionSet;
			let transactionSetIndex;
			if (lastOperation === true) { // continue last set of transactions
				transactionSetIndex = scheduledTransactions.length - 1;
				transactionSet = scheduledTransactions[transactionSetIndex];
			} else {
				// for now we signify transactions as a true
				if (asyncTransactionAfter) // by default we add a flag to put transactions after other operations
					scheduledOperations.appendAsyncTxn = true;
				else if (asyncTransactionStrictOrder)
					scheduledOperations.push(true);
				else // in before mode, we put all the async transaction at the beginning
					scheduledOperations.unshift(true);
				if (!scheduledTransactions) {
					scheduledTransactions = [];
				}
				transactionSetIndex = scheduledTransactions.push(transactionSet = []) - 1;
			}
			let index = (transactionSet.push(asChild ?
				{asChild, callback } : callback) - 1) << 1;
			return this.scheduleCommit().results.then((results) => {
				let transactionResults = results.transactionResults[transactionSetIndex];
				let error = transactionResults[index];
				if (error)
					throw error
				return transactionResults[index + 1]
			})
		}
		getSharedBufferForGet(id) {
			let txn = ( (readTxnRenewed ? readTxn : renewReadTxn()));
			lastSize = this.keyIsCompatibility ? txn.getBinaryShared(id) : this.db.get(this.writeKey(id, keyBytes, 0));
			if (lastSize === 0xffffffff) { // not found code
				return //undefined
			}
			return lastSize
		}

		getSizeBinaryFast(id) {
			(env.writeTxn || (readTxnRenewed ? readTxn : renewReadTxn()));
			lastSize = this.db.getByBinary(this.writeKey(id, keyBytes, 0));
		}
		getString(id) {
			(env.writeTxn || (readTxnRenewed ? readTxn : renewReadTxn()));
			let string = this.db.getStringByBinary(this.writeKey(id, keyBytes, 0));
			if (string)
				lastSize = string.length;
			return string
		}
		getBinaryFast(id) {
			this.getSizeBinaryFast(id);
			return lastSize === 0xffffffff ? undefined : this.db.unsafeBuffer.subarray(0, lastSize)
		}
		getBinary(id) {
			this.getSizeBinaryFast(id);
			return lastSize === 0xffffffff ? undefined : Uint8ArraySlice$1.call(this.db.unsafeBuffer, 0, lastSize)
		}
		get(id) {
			if (this.decoder) {
				this.getSizeBinaryFast(id);
				return lastSize === 0xffffffff ? undefined : this.decoder.decode(this.db.unsafeBuffer, lastSize)
			}
			if (this.encoding == 'binary')
				return this.getBinary(id)

			let result = this.getString(id);
			if (result) {
				if (this.encoding == 'json')
					return JSON.parse(result)
			}
			return result
		}
		getEntry(id) {
			let value = this.get(id);
			if (value !== undefined) {
				if (this.useVersions)
					return {
						value,
						version: getLastVersion$1(),
						//size: lastSize
					}
				else
					return {
						value,
						//size: lastSize
					}
			}
		}
		resetReadTxn() {
			resetReadTxn();
		}
		doesExist(key, versionOrValue) {
			if (!env.writeTxn)
				readTxnRenewed ? readTxn : renewReadTxn();
			if (versionOrValue === undefined) {
				this.getSizeBinaryFast(key);
				return lastSize !== 0xffffffff
			}
			else if (this.useVersions) {
				this.getSizeBinaryFast(key);
				return lastSize !== 0xffffffff && matches(getLastVersion$1(), versionOrValue)
			}
			else {
				if (versionOrValue && versionOrValue[binaryBuffer])
					versionOrValue = versionOrValue[binaryBuffer];
				else if (this.encoder)
					versionOrValue = this.encoder.encode(versionOrValue);
				if (typeof versionOrValue == 'string')
					versionOrValue = Buffer.from(versionOrValue);
				return this.getValuesCount(key, { start: versionOrValue, exactMatch: true}) > 0
			}
		}
		backup(path) {
			return new Promise((resolve, reject) => env.copy(path, false, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			}))
		}
		close(callback) {
			this.db.close();
			if (this.isRoot) {
				if (readTxn) {
					try {
						readTxn.abort();
					} catch(error) {}
				}
				readTxnRenewed = null;
				env.close();
			}
			this.status = 'closed';
			if (callback)
				callback();			
		}
		isOperational() {
			return this.status == 'open'
		}
		getStats() {
			return this.db.stat(readTxnRenewed ? readTxn : renewReadTxn())
		}
		sync(callback) {
			return env.sync(callback || function(error) {
				if (error) {
					console.error(error);
				}
			})
		}
		deleteDB() {
			console.warn('deleteDB() is deprecated, use drop or dropSync instead');
			return this.dropSync()
		}
		dropSync() {
			this.transactionSync(() =>
				this.db.drop({
					justFreePages: false
				}),
			{ abortable: false });
		}
		clear(callback) {
			if (typeof callback == 'function')
				return this.clearAsync(callback)
			console.warn('clear() is deprecated, use clearAsync or clearSync instead');
			this.clearSync();
		}
		clearSync() {
			if (this.encoder && this.encoder.structures)
				this.encoder.structures = [];
			this.transactionSync(() =>
				this.db.drop({
					justFreePages: true
				}),
			{ abortable: false });
		}
		readerCheck() {
			return env.readerCheck()
		}
		readerList() {
			return env.readerList().join('')
		}
		setupSharedStructures() {
			const getStructures = () => {
				let lastVersion; // because we are doing a read here, we may need to save and restore the lastVersion from the last read
				if (this.useVersions)
					lastVersion = getLastVersion$1();
				let buffer = this.getBinary(this.sharedStructuresKey);
				if (this.useVersions)
					setLastVersion(lastVersion);
				return buffer ? this.encoder.decode(buffer) : []
			};
			return {
				saveStructures: (structures, previousLength) => {
					return this.transactionSyncStart(() => {
						let existingStructuresBuffer = this.getBinary(this.sharedStructuresKey);
						let existingStructures = existingStructuresBuffer ? this.encoder.decode(existingStructuresBuffer) : [];
						if (existingStructures.length != previousLength)
							return false // it changed, we need to indicate that we couldn't update
						this.put(this.sharedStructuresKey, structures);
					})
				},
				getStructures,
				copyBuffers: true, // need to copy any embedded buffers that are found since we use unsafe buffers
			}
		}
	}
	// if caching class overrides putSync, don't want to double call the caching code
	const putSync = LMDBStore.prototype.putSync;
	const removeSync = LMDBStore.prototype.removeSync;
	addQueryMethods(LMDBStore, { env, getReadTxn() {
		return readTxnRenewed ? readTxn : renewReadTxn()
	}, saveKey: saveKey$1, keyBytes, keyBytesView, getLastVersion: getLastVersion$1 });
	addWriteMethods(LMDBStore, { env, fixedBuffer: keyBytes, resetReadTxn, binaryBuffer, ...options });
	LMDBStore.prototype.supports = {
		permanence: true,
		bufferKeys: true,
		promises: true,
		snapshots: true,
		clear: true,
		status: true,
		deferredOpen: true,
		openCallback: true,	
	};
	return options.cache ?
		new (CachingStore(LMDBStore))(options.name || null, options) :
		new LMDBStore(options.name || null, options)
}

function matches(previousVersion, ifVersion){
	let matches;
	if (previousVersion) {
		if (ifVersion) {
			matches = previousVersion == ifVersion;
		} else {
			matches = false;
		}
	} else {
		matches = !ifVersion;
	}
	return matches
}
function getLastEntrySize() {
	return lastSize
}
function getLastVersion$1() {
	return keyBytesView.getFloat64(16, true)
}

function setLastVersion(version) {
	return keyBytesView.setFloat64(16, version, true)
}
function asBinary(buffer) {
	return {
		[binaryBuffer]: buffer
	}
}
let saveBuffer$1, saveDataView$1, saveDataAddress$1;
let savePosition$1 = 8000;
function allocateSaveBuffer$1() {
	saveBuffer$1 = Buffer.alloc(8192);
	saveBuffer$1.dataView = saveDataView$1 = new DataView(saveBuffer$1.buffer, saveBuffer$1.byteOffset, saveBuffer$1.byteLength);
	saveBuffer$1.buffer.address = getAddress(saveBuffer$1.buffer);
	saveDataAddress$1 = saveBuffer$1.buffer.address + saveBuffer$1.byteOffset;
	savePosition$1 = 0;

}
function allocateFixedBuffer() {
	keyBytes = Buffer.allocUnsafeSlow(2048);
	const keyBuffer = keyBytes.buffer;
	keyBytesView = keyBytes.dataView = new DataView(keyBytes.buffer, 0, 2048); // max key size is actually 1978
	keyBytes.uint32 = new Uint32Array(keyBuffer, 0, 512);
	keyBytes.float64 = new Float64Array(keyBuffer, 0, 256);
	keyBytes.uint32.address = keyBytes.address = keyBuffer.address = getAddress(keyBuffer);
}
function saveKey$1(key, writeKey, saveTo) {
	if (savePosition$1 > 6200) {
		allocateSaveBuffer$1();
	}
	let start = savePosition$1;
	savePosition$1 = writeKey(key, saveBuffer$1, start + 4);
	saveDataView$1.setUint32(start, savePosition$1 - start - 4, true);
	saveTo.saveBuffer = saveBuffer$1;
	savePosition$1 = (savePosition$1 + 7) & 0xfffff8;
	return start + saveDataAddress$1
}

const require$2 = module$1.createRequire((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('node-index.cjs', document.baseURI).href)));
let nativeFunctions, dirName = path.dirname(url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('node-index.cjs', document.baseURI).href)))).replace(/dist$/, '');
try {
	console.log(dirName);
	nativeFunctions = require$2('node-gyp-build')(dirName);
	if (process.versions.modules == 93)
		require$2('v8').setFlagsFromString('--turbo-fast-api-calls');
} catch(error) {
	if (process.versions.modules == 93) {
		// use this abi version as the backup version without turbo-fast-api-calls enabled
		Object.defineProperty(process.versions, 'modules', { value: '92' });
		try {
			nativeFunctions = require$2('node-gyp-build')(dirName);
		} catch(secondError) {
			throw error
		} finally {
			Object.defineProperty(process.versions, 'modules', { value: '93' });
		}
	} else
		throw error
}
nativeFunctions.require = require$2;
nativeFunctions.arch = os.arch;
nativeFunctions.fs = fs$1;
setNativeFunctions(nativeFunctions);
var nodeIndex = {
	open, getLastVersion: getLastVersion$1, compareKey: index_js.compareKeys, keyValueToBuffer: index_js.toBufferKey, bufferToKeyValue: index_js.fromBufferKey
};

Object.defineProperty(exports, 'bufferToKeyValue', {
    enumerable: true,
    get: function () {
        return index_js.fromBufferKey;
    }
});
Object.defineProperty(exports, 'compareKey', {
    enumerable: true,
    get: function () {
        return index_js.compareKeys;
    }
});
Object.defineProperty(exports, 'compareKeys', {
    enumerable: true,
    get: function () {
        return index_js.compareKeys;
    }
});
Object.defineProperty(exports, 'keyValueToBuffer', {
    enumerable: true,
    get: function () {
        return index_js.toBufferKey;
    }
});
exports.ABORT = ABORT;
exports.allDbs = allDbs;
exports.asBinary = asBinary;
exports.default = nodeIndex;
exports.getLastEntrySize = getLastEntrySize;
exports.getLastVersion = getLastVersion$1;
exports.levelup = levelup;
exports.open = open;
exports.setLastVersion = setLastVersion;
//# sourceMappingURL=node-index.cjs.map
