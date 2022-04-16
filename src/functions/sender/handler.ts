import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { Context, APIGatewayProxyEvent } from 'aws-lambda';
import { SQS } from 'aws-sdk';
import schema from './schema';

const sqs = new SQS({ region: 'ap-south-1' });

const sender: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event:APIGatewayProxyEvent , context:Context) => {
  let accountId = context.invokedFunctionArn.split(":")[4];
  let queueUrl = 'https://sqs.ap-south-1.amazonaws.com/' + accountId + '/MyQueue';
  
  // SQS message parameters
  let params : SQS.Types.SendMessageRequest = {
    MessageBody: event.body,
    QueueUrl: queueUrl
  };

  let result = await sqs.sendMessage(params);
  console.log('data:', result);
  let responseBody = {
    message: ''
  };
  responseBody.message = 'Sent to ' + queueUrl;
  
  return formatJSONResponse(responseBody);
};

export const main = middyfy(sender);
