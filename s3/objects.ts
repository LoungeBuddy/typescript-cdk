import {
  ListObjectsOutput,
  PutObjectOutput,
  PutObjectRequest,
  GetObjectOutput,
  DeleteObjectOutput,
} from "aws-sdk/clients/s3";
import dayjs from "dayjs";
import { Readable } from "stream";
import client from "./client";

type Data = string | Uint8Array | Buffer | Readable;

export const list = async (bucket: string): Promise<ListObjectsOutput> => {
  const objects = await client.listObjects({ Bucket: bucket }).promise();
  return objects;
};

export const put = async (
  bucket: string,
  key: string,
  data: Data,
  expires?: Date
): Promise<PutObjectOutput> => {
  const putObjectData: PutObjectRequest = {
    Bucket: bucket,
    Key: key,
    Body: data,
    ACL: "private",
    Expires: expires,
  };

  const response = await client.putObject(putObjectData).promise();
  return response;
};

export const isExpired = (object: GetObjectOutput): boolean => {
  if (!object.Expires) {
    return false;
  }

  return dayjs(object.Expires).isBefore(dayjs());
};

export const get = async (
  bucket: string,
  key: string
): Promise<GetObjectOutput> => {
  const object = await client.getObject({ Bucket: bucket, Key: key }).promise();
  return object;
};

export const remove = async (
  bucket: string,
  key: string
): Promise<DeleteObjectOutput> => {
  const deleted = await client
    .deleteObject({ Key: key, Bucket: bucket })
    .promise();
  return deleted;
};
