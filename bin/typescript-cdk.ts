#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import TypescriptCdkStack, { Props } from '../lib/typescript-cdk-stack';

/**
 * CDK Application
 * A CDK Application can contain one ot more stacks
 * A stack has to exist within a single AWS environment
 * meaning that it exists within a single AWS account and a corresponding region
 */

const app = new cdk.App();
const Tags = cdk.Tags;

const props: Props = {
    stackProps: {
        env: {region: "us-east-1"},
    },
    vpcProps: {
        maxAzs: 2
    },
    encryptBucket: true
};

const stack = new TypescriptCdkStack(app, 'TypescriptCdkStack', props);

Tags.of(stack).add("App", "DocumentManagement");
Tags.of(stack).add("Environment", "Development");