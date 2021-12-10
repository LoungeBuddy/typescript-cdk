import { readFileSync } from "fs";

test("Stack", () => {
  // Detect change
  expect(
    JSON.parse(readFileSync(`${process.cwd()}/templates/TypescriptCdkStack.template.json`, "utf8"))
  ).toMatchInlineSnapshot(`
    Object {
      "Outputs": Object {
        "DocumentManagementAPIAPIEndpointAAF843B7": Object {
          "Export": Object {
            "Name": "APIEndpoint",
          },
          "Value": Object {
            "Fn::Join": Array [
              "",
              Array [
                "https://",
                Object {
                  "Ref": "DocumentManagementAPIHttpApi05512C20",
                },
                ".execute-api.us-east-1.",
                Object {
                  "Ref": "AWS::URLSuffix",
                },
                "/",
              ],
            ],
          },
        },
        "DocumentsBucketNameExport": Object {
          "Export": Object {
            "Name": "DocumentsBucketName",
          },
          "Value": Object {
            "Ref": "EncryptedBucket6730B3DC",
          },
        },
      },
      "Parameters": Object {
        "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8ArtifactHash238275D6": Object {
          "Description": "Artifact hash for asset \\"a3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8\\"",
          "Type": "String",
        },
        "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8S3BucketD1AD544E": Object {
          "Description": "S3 bucket for asset \\"a3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8\\"",
          "Type": "String",
        },
        "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8S3VersionKey93A19D70": Object {
          "Description": "S3 key for asset version \\"a3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8\\"",
          "Type": "String",
        },
        "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceArtifactHash11F65DD3": Object {
          "Description": "Artifact hash for asset \\"b2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ce\\"",
          "Type": "String",
        },
        "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3BucketBDC92A6C": Object {
          "Description": "S3 bucket for asset \\"b2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ce\\"",
          "Type": "String",
        },
        "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3VersionKeyA4E2AAF3": Object {
          "Description": "S3 key for asset version \\"b2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ce\\"",
          "Type": "String",
        },
        "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacArtifactHash271C9962": Object {
          "Description": "Artifact hash for asset \\"bc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aac\\"",
          "Type": "String",
        },
        "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacS3Bucket94C314C6": Object {
          "Description": "S3 bucket for asset \\"bc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aac\\"",
          "Type": "String",
        },
        "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacS3VersionKey47ADEABC": Object {
          "Description": "S3 key for asset version \\"bc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aac\\"",
          "Type": "String",
        },
        "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68ArtifactHashD9A515C3": Object {
          "Description": "Artifact hash for asset \\"e9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68\\"",
          "Type": "String",
        },
        "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68S3BucketAEADE8C7": Object {
          "Description": "S3 bucket for asset \\"e9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68\\"",
          "Type": "String",
        },
        "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68S3VersionKeyE415415F": Object {
          "Description": "S3 key for asset version \\"e9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68\\"",
          "Type": "String",
        },
      },
      "Resources": Object {
        "CDKMetadata": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/CDKMetadata/Default",
          },
          "Properties": Object {
            "Analytics": "v2:deflate64:H4sIAAAAAAAA/11Sy27CMBD8Fu6OIY3EuZC+kCoaQcXdmC01JHZkr0HIyr/XGxNAPc3s7MaeWSfnIS8mfDJ6FmeXyd1xHKSxwMMahTyy0miH1ktkM+cAo7hXes9K79A0K3DGWwms/NGPvBJWNIBgqfjy2HpkQ79jdE9wBQ9zL4+ANHNlCebCxSlXZGEHbW0uDWjkqfVyE5ggO473rjpWi2a7EzzEsz7FBewGrFNGs3U0WwMa/ea1RFJuJI4+8gpsoxx91DElGh5Wpk7BCCtTK3np53rWMZBPPGxaSdqmKlnlt7Gx9ludIt3ZyniEb7FNxyX9rsUARiox2OgbRF4XFcFS4LtAOIsLq6w6RXo/eKHjiiMfBpKTazXD+H6/tKphO5k2Ozg4vuxhyH7r1rS3LD6OrBWfnV1Zq36VHcuL4vH/IBSt2qd7TnENH4jtrFVkgIBK+lFS3p6QlKIRI+N7e8v8r+znuo6RXX5w41M+5VOejw5Oqcx6jaoBvkr4B5r7mHS+AgAA",
          },
          "Type": "AWS::CDK::Metadata",
        },
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB6723FB92": Object {
          "DependsOn": Array [
            "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleDefaultPolicy96C3E726",
            "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleBA21DBC1",
          ],
          "Metadata": Object {
            "aws:asset:path": "asset.a3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8",
            "aws:asset:property": "Code",
            "aws:cdk:path": "TypescriptCdkStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB/Resource",
          },
          "Properties": Object {
            "Code": Object {
              "S3Bucket": Object {
                "Ref": "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8S3BucketD1AD544E",
              },
              "S3Key": Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    Object {
                      "Fn::Select": Array [
                        0,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8S3VersionKey93A19D70",
                            },
                          ],
                        },
                      ],
                    },
                    Object {
                      "Fn::Select": Array [
                        1,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersa3058ccb468d757ebb89df5363a1c20f5307c6911136f29d00e1a68c9b2aa7e8S3VersionKey93A19D70",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            },
            "Handler": "index.handler",
            "Layers": Array [
              Object {
                "Ref": "DocumentsDeploymentAwsCliLayer1230A2FB",
              },
            ],
            "MemorySize": 512,
            "Role": Object {
              "Fn::GetAtt": Array [
                "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleBA21DBC1",
                "Arn",
              ],
            },
            "Runtime": "python3.7",
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
            ],
            "Timeout": 900,
          },
          "Type": "AWS::Lambda::Function",
        },
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleBA21DBC1": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB/ServiceRole/Resource",
          },
          "Properties": Object {
            "AssumeRolePolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": "sts:AssumeRole",
                  "Effect": "Allow",
                  "Principal": Object {
                    "Service": "lambda.amazonaws.com",
                  },
                },
              ],
              "Version": "2012-10-17",
            },
            "ManagedPolicyArns": Array [
              Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    "arn:",
                    Object {
                      "Ref": "AWS::Partition",
                    },
                    ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                  ],
                ],
              },
            ],
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
            ],
          },
          "Type": "AWS::IAM::Role",
        },
        "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleDefaultPolicy96C3E726": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB/ServiceRole/DefaultPolicy/Resource",
          },
          "Properties": Object {
            "PolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": Array [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*",
                  ],
                  "Effect": "Allow",
                  "Resource": Array [
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          "arn:",
                          Object {
                            "Ref": "AWS::Partition",
                          },
                          ":s3:::",
                          Object {
                            "Ref": "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3BucketBDC92A6C",
                          },
                        ],
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          "arn:",
                          Object {
                            "Ref": "AWS::Partition",
                          },
                          ":s3:::",
                          Object {
                            "Ref": "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3BucketBDC92A6C",
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
                Object {
                  "Action": Array [
                    "s3:GetObject*",
                    "s3:GetBucket*",
                    "s3:List*",
                    "s3:DeleteObject*",
                    "s3:PutObject",
                    "s3:Abort*",
                  ],
                  "Effect": "Allow",
                  "Resource": Array [
                    Object {
                      "Fn::GetAtt": Array [
                        "EncryptedBucket6730B3DC",
                        "Arn",
                      ],
                    },
                    Object {
                      "Fn::Join": Array [
                        "",
                        Array [
                          Object {
                            "Fn::GetAtt": Array [
                              "EncryptedBucket6730B3DC",
                              "Arn",
                            ],
                          },
                          "/*",
                        ],
                      ],
                    },
                  ],
                },
              ],
              "Version": "2012-10-17",
            },
            "PolicyName": "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleDefaultPolicy96C3E726",
            "Roles": Array [
              Object {
                "Ref": "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiBServiceRoleBA21DBC1",
              },
            ],
          },
          "Type": "AWS::IAM::Policy",
        },
        "DocumentManagementAPIGetDocumentsFunction877B91B7": Object {
          "DependsOn": Array [
            "DocumentManagementAPIGetDocumentsFunctionServiceRoleDefaultPolicy789353EE",
            "DocumentManagementAPIGetDocumentsFunctionServiceRole9B86E80E",
          ],
          "Metadata": Object {
            "aws:asset:path": "asset.bc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aac",
            "aws:asset:property": "Code",
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/GetDocumentsFunction/Resource",
          },
          "Properties": Object {
            "Code": Object {
              "S3Bucket": Object {
                "Ref": "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacS3Bucket94C314C6",
              },
              "S3Key": Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    Object {
                      "Fn::Select": Array [
                        0,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacS3VersionKey47ADEABC",
                            },
                          ],
                        },
                      ],
                    },
                    Object {
                      "Fn::Select": Array [
                        1,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersbc19e40e2c7920dbb960c31e1cd2552a24493a43167f66bf44c80c43a22c3aacS3VersionKey47ADEABC",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            },
            "Environment": Object {
              "Variables": Object {
                "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1",
                "DOCUMENTS_BUCKET_NAME": Object {
                  "Ref": "EncryptedBucket6730B3DC",
                },
              },
            },
            "Handler": "index.getDocuments",
            "Role": Object {
              "Fn::GetAtt": Array [
                "DocumentManagementAPIGetDocumentsFunctionServiceRole9B86E80E",
                "Arn",
              ],
            },
            "Runtime": "nodejs14.x",
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "API",
              },
            ],
          },
          "Type": "AWS::Lambda::Function",
        },
        "DocumentManagementAPIGetDocumentsFunctionServiceRole9B86E80E": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/GetDocumentsFunction/ServiceRole/Resource",
          },
          "Properties": Object {
            "AssumeRolePolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": "sts:AssumeRole",
                  "Effect": "Allow",
                  "Principal": Object {
                    "Service": "lambda.amazonaws.com",
                  },
                },
              ],
              "Version": "2012-10-17",
            },
            "ManagedPolicyArns": Array [
              Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    "arn:",
                    Object {
                      "Ref": "AWS::Partition",
                    },
                    ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
                  ],
                ],
              },
            ],
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "API",
              },
            ],
          },
          "Type": "AWS::IAM::Role",
        },
        "DocumentManagementAPIGetDocumentsFunctionServiceRoleDefaultPolicy789353EE": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/GetDocumentsFunction/ServiceRole/DefaultPolicy/Resource",
          },
          "Properties": Object {
            "PolicyDocument": Object {
              "Statement": Array [
                Object {
                  "Action": Array [
                    "s3:GetObject",
                    "s3:PutObject",
                  ],
                  "Effect": "Allow",
                  "Resource": Object {
                    "Fn::Join": Array [
                      "",
                      Array [
                        Object {
                          "Fn::GetAtt": Array [
                            "EncryptedBucket6730B3DC",
                            "Arn",
                          ],
                        },
                        "/*",
                      ],
                    ],
                  },
                },
                Object {
                  "Action": "s3:ListBucket",
                  "Effect": "Allow",
                  "Resource": Object {
                    "Fn::GetAtt": Array [
                      "EncryptedBucket6730B3DC",
                      "Arn",
                    ],
                  },
                },
              ],
              "Version": "2012-10-17",
            },
            "PolicyName": "DocumentManagementAPIGetDocumentsFunctionServiceRoleDefaultPolicy789353EE",
            "Roles": Array [
              Object {
                "Ref": "DocumentManagementAPIGetDocumentsFunctionServiceRole9B86E80E",
              },
            ],
          },
          "Type": "AWS::IAM::Policy",
        },
        "DocumentManagementAPIHttpApi05512C20": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/HttpApi/Resource",
          },
          "Properties": Object {
            "CorsConfiguration": Object {
              "AllowMethods": Array [
                "GET",
              ],
              "AllowOrigins": Array [
                "*",
              ],
              "MaxAge": 864000,
            },
            "Name": "document-management-api",
            "ProtocolType": "HTTP",
            "Tags": Object {
              "App": "DocumentManagement",
              "Environment": "Development",
              "Module": "API",
            },
          },
          "Type": "AWS::ApiGatewayV2::Api",
        },
        "DocumentManagementAPIHttpApiANYgetdocumentsFA98B2FA": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/HttpApi/ANY--get-documents/Resource",
          },
          "Properties": Object {
            "ApiId": Object {
              "Ref": "DocumentManagementAPIHttpApi05512C20",
            },
            "AuthorizationType": "NONE",
            "RouteKey": "ANY /get-documents",
            "Target": Object {
              "Fn::Join": Array [
                "",
                Array [
                  "integrations/",
                  Object {
                    "Ref": "DocumentManagementAPIHttpApiANYgetdocumentsHttpIntegration83590885b0be8447618bb0d399e8050589847862",
                  },
                ],
              ],
            },
          },
          "Type": "AWS::ApiGatewayV2::Route",
        },
        "DocumentManagementAPIHttpApiANYgetdocumentsHttpIntegration83590885b0be8447618bb0d399e8050589847862": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/HttpApi/ANY--get-documents/HttpIntegration-83590885b0be8447618bb0d399e80505/Resource",
          },
          "Properties": Object {
            "ApiId": Object {
              "Ref": "DocumentManagementAPIHttpApi05512C20",
            },
            "IntegrationType": "AWS_PROXY",
            "IntegrationUri": Object {
              "Fn::GetAtt": Array [
                "DocumentManagementAPIGetDocumentsFunction877B91B7",
                "Arn",
              ],
            },
            "PayloadFormatVersion": "2.0",
          },
          "Type": "AWS::ApiGatewayV2::Integration",
        },
        "DocumentManagementAPIHttpApiANYgetdocumentsTypescriptCdkStackDocumentManagementAPIHttpApiANYgetdocumentsCF5281E8PermissionEF7D5F91": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/HttpApi/ANY--get-documents/TypescriptCdkStackDocumentManagementAPIHttpApiANYgetdocumentsCF5281E8-Permission",
          },
          "Properties": Object {
            "Action": "lambda:InvokeFunction",
            "FunctionName": Object {
              "Fn::GetAtt": Array [
                "DocumentManagementAPIGetDocumentsFunction877B91B7",
                "Arn",
              ],
            },
            "Principal": "apigateway.amazonaws.com",
            "SourceArn": Object {
              "Fn::Join": Array [
                "",
                Array [
                  "arn:",
                  Object {
                    "Ref": "AWS::Partition",
                  },
                  ":execute-api:us-east-1:",
                  Object {
                    "Ref": "AWS::AccountId",
                  },
                  ":",
                  Object {
                    "Ref": "DocumentManagementAPIHttpApi05512C20",
                  },
                  "/*/*/get-documents",
                ],
              ],
            },
          },
          "Type": "AWS::Lambda::Permission",
        },
        "DocumentManagementAPIHttpApiDefaultStageB3BC8B11": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentManagementAPI/HttpApi/DefaultStage/Resource",
          },
          "Properties": Object {
            "ApiId": Object {
              "Ref": "DocumentManagementAPIHttpApi05512C20",
            },
            "AutoDeploy": true,
            "StageName": "$default",
            "Tags": Object {
              "App": "DocumentManagement",
              "Environment": "Development",
              "Module": "API",
            },
          },
          "Type": "AWS::ApiGatewayV2::Stage",
        },
        "DocumentsDeploymentAwsCliLayer1230A2FB": Object {
          "Metadata": Object {
            "aws:asset:path": "asset.e9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68.zip",
            "aws:asset:property": "Content",
            "aws:cdk:path": "TypescriptCdkStack/DocumentsDeployment/AwsCliLayer/Resource",
          },
          "Properties": Object {
            "Content": Object {
              "S3Bucket": Object {
                "Ref": "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68S3BucketAEADE8C7",
              },
              "S3Key": Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    Object {
                      "Fn::Select": Array [
                        0,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68S3VersionKeyE415415F",
                            },
                          ],
                        },
                      ],
                    },
                    Object {
                      "Fn::Select": Array [
                        1,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParameterse9882ab123687399f934da0d45effe675ecc8ce13b40cb946f3e1d6141fe8d68S3VersionKeyE415415F",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            },
            "Description": "/opt/awscli/aws",
          },
          "Type": "AWS::Lambda::LayerVersion",
        },
        "DocumentsDeploymentCustomResource25E0B1AD": Object {
          "DeletionPolicy": "Delete",
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/DocumentsDeployment/CustomResource/Default",
          },
          "Properties": Object {
            "DestinationBucketName": Object {
              "Ref": "EncryptedBucket6730B3DC",
            },
            "Prune": true,
            "ServiceToken": Object {
              "Fn::GetAtt": Array [
                "CustomCDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C512MiB6723FB92",
                "Arn",
              ],
            },
            "SourceBucketNames": Array [
              Object {
                "Ref": "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3BucketBDC92A6C",
              },
            ],
            "SourceObjectKeys": Array [
              Object {
                "Fn::Join": Array [
                  "",
                  Array [
                    Object {
                      "Fn::Select": Array [
                        0,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3VersionKeyA4E2AAF3",
                            },
                          ],
                        },
                      ],
                    },
                    Object {
                      "Fn::Select": Array [
                        1,
                        Object {
                          "Fn::Split": Array [
                            "||",
                            Object {
                              "Ref": "AssetParametersb2b90ac3a581f916da564359208307409ffd8eb2caaac50a506841d41eb1b9ceS3VersionKeyA4E2AAF3",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                ],
              },
            ],
          },
          "Type": "Custom::CDKBucketDeployment",
          "UpdateReplacePolicy": "Delete",
        },
        "EncryptedBucket46DD4932": Object {
          "DeletionPolicy": "Delete",
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/EncryptedBucket/EncryptedBucket/Resource",
          },
          "Properties": Object {
            "BucketEncryption": Object {
              "ServerSideEncryptionConfiguration": Array [
                Object {
                  "ServerSideEncryptionByDefault": Object {
                    "SSEAlgorithm": "aws:kms",
                  },
                },
              ],
            },
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
            ],
          },
          "Type": "AWS::S3::Bucket",
          "UpdateReplacePolicy": "Delete",
        },
        "EncryptedBucket6730B3DC": Object {
          "DeletionPolicy": "Retain",
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/EncryptedBucket/Resource",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
            ],
          },
          "Type": "AWS::S3::Bucket",
          "UpdateReplacePolicy": "Retain",
        },
        "NetworkingConstruct1BEEB40A": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/Resource",
          },
          "Properties": Object {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": true,
            "EnableDnsSupport": true,
            "InstanceTenancy": "default",
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct",
              },
            ],
          },
          "Type": "AWS::EC2::VPC",
        },
        "NetworkingConstructIGW5214B292": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/IGW",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct",
              },
            ],
          },
          "Type": "AWS::EC2::InternetGateway",
        },
        "NetworkingConstructPrivateSubnet1DefaultRouteC7B718A4": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1/DefaultRoute",
          },
          "Properties": Object {
            "DestinationCidrBlock": "0.0.0.0/0",
            "NatGatewayId": Object {
              "Ref": "NetworkingConstructPublicSubnet1NATGatewayF3BB618C",
            },
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPrivateSubnet1RouteTable7510F333",
            },
          },
          "Type": "AWS::EC2::Route",
        },
        "NetworkingConstructPrivateSubnet1RouteTable7510F333": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1/RouteTable",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::RouteTable",
        },
        "NetworkingConstructPrivateSubnet1RouteTableAssociation08BE28A4": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1/RouteTableAssociation",
          },
          "Properties": Object {
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPrivateSubnet1RouteTable7510F333",
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPrivateSubnet1SubnetD8B15A99",
            },
          },
          "Type": "AWS::EC2::SubnetRouteTableAssociation",
        },
        "NetworkingConstructPrivateSubnet1SubnetD8B15A99": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1/Subnet",
          },
          "Properties": Object {
            "AvailabilityZone": Object {
              "Fn::Select": Array [
                0,
                Object {
                  "Fn::GetAZs": "",
                },
              ],
            },
            "CidrBlock": "10.0.2.0/24",
            "MapPublicIpOnLaunch": false,
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "aws-cdk:subnet-name",
                "Value": "Private",
              },
              Object {
                "Key": "aws-cdk:subnet-type",
                "Value": "Private",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet1",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::Subnet",
        },
        "NetworkingConstructPrivateSubnet2DefaultRoute3E85DB77": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2/DefaultRoute",
          },
          "Properties": Object {
            "DestinationCidrBlock": "0.0.0.0/0",
            "NatGatewayId": Object {
              "Ref": "NetworkingConstructPublicSubnet2NATGateway51DDD3F4",
            },
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPrivateSubnet2RouteTable66EED5EA",
            },
          },
          "Type": "AWS::EC2::Route",
        },
        "NetworkingConstructPrivateSubnet2RouteTable66EED5EA": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2/RouteTable",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::RouteTable",
        },
        "NetworkingConstructPrivateSubnet2RouteTableAssociation8B1F40EA": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2/RouteTableAssociation",
          },
          "Properties": Object {
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPrivateSubnet2RouteTable66EED5EA",
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPrivateSubnet2Subnet4B632D64",
            },
          },
          "Type": "AWS::EC2::SubnetRouteTableAssociation",
        },
        "NetworkingConstructPrivateSubnet2Subnet4B632D64": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2/Subnet",
          },
          "Properties": Object {
            "AvailabilityZone": Object {
              "Fn::Select": Array [
                1,
                Object {
                  "Fn::GetAZs": "",
                },
              ],
            },
            "CidrBlock": "10.0.3.0/24",
            "MapPublicIpOnLaunch": false,
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "aws-cdk:subnet-name",
                "Value": "Private",
              },
              Object {
                "Key": "aws-cdk:subnet-type",
                "Value": "Private",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PrivateSubnet2",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::Subnet",
        },
        "NetworkingConstructPublicSubnet1DefaultRoute81DC539C": Object {
          "DependsOn": Array [
            "NetworkingConstructVPCGW4C4E3BC7",
          ],
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/DefaultRoute",
          },
          "Properties": Object {
            "DestinationCidrBlock": "0.0.0.0/0",
            "GatewayId": Object {
              "Ref": "NetworkingConstructIGW5214B292",
            },
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPublicSubnet1RouteTableFA1142F4",
            },
          },
          "Type": "AWS::EC2::Route",
        },
        "NetworkingConstructPublicSubnet1EIP1676A0F6": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/EIP",
          },
          "Properties": Object {
            "Domain": "vpc",
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1",
              },
            ],
          },
          "Type": "AWS::EC2::EIP",
        },
        "NetworkingConstructPublicSubnet1NATGatewayF3BB618C": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/NATGateway",
          },
          "Properties": Object {
            "AllocationId": Object {
              "Fn::GetAtt": Array [
                "NetworkingConstructPublicSubnet1EIP1676A0F6",
                "AllocationId",
              ],
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPublicSubnet1Subnet36B717DF",
            },
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1",
              },
            ],
          },
          "Type": "AWS::EC2::NatGateway",
        },
        "NetworkingConstructPublicSubnet1RouteTableAssociationDC5B65E4": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/RouteTableAssociation",
          },
          "Properties": Object {
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPublicSubnet1RouteTableFA1142F4",
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPublicSubnet1Subnet36B717DF",
            },
          },
          "Type": "AWS::EC2::SubnetRouteTableAssociation",
        },
        "NetworkingConstructPublicSubnet1RouteTableFA1142F4": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/RouteTable",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::RouteTable",
        },
        "NetworkingConstructPublicSubnet1Subnet36B717DF": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1/Subnet",
          },
          "Properties": Object {
            "AvailabilityZone": Object {
              "Fn::Select": Array [
                0,
                Object {
                  "Fn::GetAZs": "",
                },
              ],
            },
            "CidrBlock": "10.0.0.0/24",
            "MapPublicIpOnLaunch": true,
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "aws-cdk:subnet-name",
                "Value": "Public",
              },
              Object {
                "Key": "aws-cdk:subnet-type",
                "Value": "Public",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet1",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::Subnet",
        },
        "NetworkingConstructPublicSubnet2DefaultRoute0090D416": Object {
          "DependsOn": Array [
            "NetworkingConstructVPCGW4C4E3BC7",
          ],
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/DefaultRoute",
          },
          "Properties": Object {
            "DestinationCidrBlock": "0.0.0.0/0",
            "GatewayId": Object {
              "Ref": "NetworkingConstructIGW5214B292",
            },
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPublicSubnet2RouteTable43E7B915",
            },
          },
          "Type": "AWS::EC2::Route",
        },
        "NetworkingConstructPublicSubnet2EIP26AF2ABA": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/EIP",
          },
          "Properties": Object {
            "Domain": "vpc",
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2",
              },
            ],
          },
          "Type": "AWS::EC2::EIP",
        },
        "NetworkingConstructPublicSubnet2NATGateway51DDD3F4": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/NATGateway",
          },
          "Properties": Object {
            "AllocationId": Object {
              "Fn::GetAtt": Array [
                "NetworkingConstructPublicSubnet2EIP26AF2ABA",
                "AllocationId",
              ],
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPublicSubnet2Subnet83F6C69A",
            },
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2",
              },
            ],
          },
          "Type": "AWS::EC2::NatGateway",
        },
        "NetworkingConstructPublicSubnet2RouteTable43E7B915": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/RouteTable",
          },
          "Properties": Object {
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::RouteTable",
        },
        "NetworkingConstructPublicSubnet2RouteTableAssociation92BEACD3": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/RouteTableAssociation",
          },
          "Properties": Object {
            "RouteTableId": Object {
              "Ref": "NetworkingConstructPublicSubnet2RouteTable43E7B915",
            },
            "SubnetId": Object {
              "Ref": "NetworkingConstructPublicSubnet2Subnet83F6C69A",
            },
          },
          "Type": "AWS::EC2::SubnetRouteTableAssociation",
        },
        "NetworkingConstructPublicSubnet2Subnet83F6C69A": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2/Subnet",
          },
          "Properties": Object {
            "AvailabilityZone": Object {
              "Fn::Select": Array [
                1,
                Object {
                  "Fn::GetAZs": "",
                },
              ],
            },
            "CidrBlock": "10.0.1.0/24",
            "MapPublicIpOnLaunch": true,
            "Tags": Array [
              Object {
                "Key": "App",
                "Value": "DocumentManagement",
              },
              Object {
                "Key": "aws-cdk:subnet-name",
                "Value": "Public",
              },
              Object {
                "Key": "aws-cdk:subnet-type",
                "Value": "Public",
              },
              Object {
                "Key": "Environment",
                "Value": "Development",
              },
              Object {
                "Key": "Module",
                "Value": "Networking",
              },
              Object {
                "Key": "Name",
                "Value": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/PublicSubnet2",
              },
            ],
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::Subnet",
        },
        "NetworkingConstructVPCGW4C4E3BC7": Object {
          "Metadata": Object {
            "aws:cdk:path": "TypescriptCdkStack/NetworkingConstruct/NetworkingConstruct/VPCGW",
          },
          "Properties": Object {
            "InternetGatewayId": Object {
              "Ref": "NetworkingConstructIGW5214B292",
            },
            "VpcId": Object {
              "Ref": "NetworkingConstruct1BEEB40A",
            },
          },
          "Type": "AWS::EC2::VPCGatewayAttachment",
        },
      },
    }
  `);
});
