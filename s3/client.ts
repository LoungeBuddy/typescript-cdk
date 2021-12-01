// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

import s3 from "aws-sdk/clients/s3";
/*import { httpsAgent } from "shop-backend-core-http-agent-utils";
import { secretReader } from "shop-backend-core-epaas-secret-reader";

const secretAccessKey = secretReader("S3_SECRET_KEY")();
const accessKeyId = secretReader("S3_ACCESS_KEY")();
const endpoint = secretReader("S3_ENDPOINT")();*/

/*if (!secretAccessKey || !accessKeyId || !endpoint) {
  throw new Error("s3 credentials are not available");
}*/

const client = new s3({});

export default client;
