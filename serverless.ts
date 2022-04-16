import type { AWS } from "@serverless/typescript";

import sender from "@functions/sender";
import receiver from "@functions/receiver";

const serverlessConfiguration: AWS = {
  service: "serverless-proto-1",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "ap-south-1",
    profile: "serverlessUser",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["sqs:SendMessage", "sqs:GetQueueUrl", "sqs:ChangeMessageVisibility", "sqs:ChangeMessageVisibility", "sqs:ChangeMessageVisibilityBatch", "sqs:DeleteMessage", "sqs:DeleteMessageBatch"],
        Resource: "arn:aws:sqs:${self:provider.region}:*:MyQueue",
      },
      {
        Effect: "Allow",
        Action: ["sqs:ListQueues"],
        Resource: "arn:aws:sqs:${self:provider.region}:811338114639:*",
      },
      {
        Effect: "Allow",
        Action: [
          "dynamodb:DescribeTable",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DeleteItem",
        ],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:*",
      },
    ],
  },
  // import the function via paths
  functions: { receiver, sender },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      MyQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "MyQueue",
        },
      },
      NonRetriableRecords: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],

          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 2,
            WriteCapacityUnits: 2,
          },
          TableName: "NonRetriableRecords",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
