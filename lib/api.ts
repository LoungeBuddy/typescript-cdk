import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import * as path from "path";
import s3 from "@aws-cdk/aws-s3";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";

interface DocumentManagementAPIProps {
    documentBucket: s3.IBucket;
}

class DocumentManagementAP extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: DocumentManagementAPIProps) {
        super(scope, id);
        const getDocumentsFunction = new lambda.NodejsFunction(this, "GetDocumentsFunction", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "..", "api", "getDocuments", "index.ts"),
            handler: "getDocuments",
            environment: {
                DOCUMENTS_BUCKET_NAME: props.documentBucket.bucketName
            }
        });

        const bucketPermissions = new PolicyStatement();
        bucketPermissions.addResources(`${props.documentBucket.bucketArn}/*`);
        bucketPermissions.addActions("s3:GetObject", "s3:PutObject");
        getDocumentsFunction.addToRolePolicy((bucketPermissions));

        const bucketContainerPermissions = new PolicyStatement();
        bucketContainerPermissions.addResources(props.documentBucket.bucketArn);
        bucketContainerPermissions.addActions("s3:ListBucket");
        getDocumentsFunction.addToRolePolicy((bucketContainerPermissions));

        const httpApi = new HttpApi(this, 'HttpApi', {
            apiName: 'document-management-api',
            createDefaultStage: true,
            corsPreflight: {
                // @ts-ignore
                allowMethods: [ HttpMethod.GET ],
                allowOrigins: [ "*" ],
                // @ts-ignore
                maxAge: cdk.Duration.days(10),
            }
        });

        const integration = new LambdaProxyIntegration({
            handler: getDocumentsFunction
        });

        httpApi.addRoutes({
            path: "/get-documents",
            // @ts-ignore
            integration: integration,
        });

        new cdk.CfnOutput(this, "APIEndpoint", {
            value: httpApi.url!,
            exportName: "APIEndpoint"
        })
    }
}

export default DocumentManagementAP;