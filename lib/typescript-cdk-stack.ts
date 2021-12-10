import * as cdk from '@aws-cdk/core';
import * as path from "path";
import {Bucket, BucketProps, BucketEncryption} from "@aws-cdk/aws-s3";
import { VpcProps } from "@aws-cdk/aws-ec2";
import S3Bucket from "./bucket";
import Networking from "./networking";
import DocumentManagementAPI from "./api";
import * as s3Deploy from "@aws-cdk/aws-s3-deployment"

export interface Props {
    stackProps?: cdk.StackProps;
    bucketProps?: BucketProps;
    vpcProps?:  VpcProps;
    encryptBucket?: boolean;
}

class TypescriptCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: Props) {
        super(scope, id, props?.stackProps);

        // s3 bucket
        const bucketOptions = {}
        let bucketName = "UnencryptedBucket";
        if (props?.encryptBucket) {
            // @ts-ignore
            bucketOptions.encryption = BucketEncryption.KMS_MANAGED;
            bucketName = "EncryptedBucket"
        }
        const bucket:Bucket = new S3Bucket(this, bucketName, bucketOptions as BucketProps);

        new s3Deploy.BucketDeployment(this, 'DocumentsDeployment', {
            sources: [s3Deploy.Source.asset(path.join(__dirname, "..", 'documents'))],
            destinationBucket: bucket,
            memoryLimit: 512
        });

        new cdk.CfnOutput(this, 'DocumentsBucketNameExport', {
            value: bucket.bucketName,
            exportName: 'DocumentsBucketName'
        });

        // networking
        const networkingConstruct = new Networking(this, 'NetworkingConstruct', props?.vpcProps);
        cdk.Tags.of(networkingConstruct).add("Module", "Networking");

        // API Construct - lambda-Nodejs
        const apiConstruct = new DocumentManagementAPI(this, 'DocumentManagementAPI', {
            documentBucket: bucket
        });
        cdk.Tags.of(apiConstruct).add("Module", "API");
    }
}

export default TypescriptCdkStack;
