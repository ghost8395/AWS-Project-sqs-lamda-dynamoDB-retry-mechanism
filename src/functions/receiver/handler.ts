import { middyfy } from '@libs/lambda';
import { Context} from 'aws-lambda';
import { SQS, DynamoDB } from 'aws-sdk';
import { SQSEvent, SQSRecord, SQSRecordAttributes } from 'aws-lambda/trigger/sqs';

const sqs = new SQS();
const dynamoDB = new DynamoDB.DocumentClient();
let MESSAGE_QUEUE_URL;

interface DequeuedMessage {
  id: string;
  receiptHandle: string;
  attributes: SQSRecordAttributes;
  nonRetriableMessage?: boolean; 
  VisibilityTimeout?:number
}


const receiver = async (sqsEvent: SQSEvent, context:Context) => {
  const accountId = context.invokedFunctionArn.split(":")[4];
  MESSAGE_QUEUE_URL = 'https://sqs.ap-south-1.amazonaws.com/' + accountId + '/MyQueue';
  const successfullyProcessedMessages: DequeuedMessage[] = [];
  const nonRetriableMessages: DequeuedMessage[] = [];
  const retriableMessages: DequeuedMessage[] = [];
  const dequeuedMessages = mapEventToDequeuedMessages(sqsEvent);

  dequeuedMessages.forEach((message: DequeuedMessage) => {
    try {
      processMessage(message);
      successfullyProcessedMessages.push(message);
    } catch (error) {
      if (message.nonRetriableMessage) {
        if (parseInt(message.attributes.ApproximateReceiveCount) >= 3) {
          nonRetriableMessages.push(message);
        } else {
          retriableMessages.push(addExponentialBackOff(message));
        }
      } else {
        retriableMessages.push(addExponentialBackOff(message));
      }
    }
  });

  await changeVisibilityMessages(retriableMessages);
  await pushToDynamoDb(nonRetriableMessages);
  await deleteMessages([...successfullyProcessedMessages,...nonRetriableMessages]);

};

let deleteMessages = async (deleteMessageRequests: DequeuedMessage[]): Promise<SQS.DeleteMessageBatchResult> => {
  if (deleteMessageRequests.length <= 0) {
    return;
  }

  const result = await sqs
    .deleteMessageBatch({
      QueueUrl: MESSAGE_QUEUE_URL,
      Entries: deleteMessageRequests.map((m) => ({
        Id: m.id,
        ReceiptHandle: m.receiptHandle,
      })),
    })
    .promise();

  if (result.Failed.length > 0) {
    throw new Error("Unable to delete messages from queue.");
  }
  return result;
};

let pushToDynamoDb = async (nonRetriableMessages: DequeuedMessage[]) :Promise<DynamoDB.DocumentClient.BatchWriteItemOutput> => {
  if (nonRetriableMessages.length <= 0) {
    return;
  }
  const timeStamp = new Date().getTime();
  let items : DynamoDB.DocumentClient.WriteRequest[]= nonRetriableMessages.map((ele) => {
    return {
      PutRequest: {
        Item: {
          ...ele,
          createdAt: timeStamp,
          updatedAt: timeStamp
        }
      }
    }
  });
  let params: DynamoDB.DocumentClient.BatchWriteItemInput = {
    RequestItems: {
      NonRetriableRecords: items
    }
  }
  const result = await dynamoDB.batchWrite(params).promise();
  return result;
};

let changeVisibilityMessages = async (messages: DequeuedMessage[]): Promise<SQS.ChangeMessageVisibilityBatchResult> => {
  if (messages.length <= 0) {
    return;
  }
  const result = await sqs.changeMessageVisibilityBatch({
    QueueUrl: MESSAGE_QUEUE_URL,
    Entries: messages.map((message) => ({
      Id: message.id,
      ReceiptHandle: message.receiptHandle,
      VisibilityTimeout: message.VisibilityTimeout,
    })),
  }).promise();
  if (result.Failed.length > 0) {
    throw new Error("Unable to change visibility for message.");
  }
  return result;
};

let randomIntFromInterval = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

let addExponentialBackOff = (message :DequeuedMessage): DequeuedMessage => {
  // calculate backoff time
  let base_backoff = 60;
  let visibility_timeout =
    base_backoff * 1.5 ** (parseInt(message.attributes.ApproximateReceiveCount) - 1);
  // add jitter
  let timeoutWithJitter = randomIntFromInterval(
    base_backoff,
    visibility_timeout
  );
  // addVisibilityToMessage
  message.VisibilityTimeout = timeoutWithJitter;
  return message;
};

let processMessage = (message : DequeuedMessage) => {
  if (message.nonRetriableMessage) {
    throw new Error(
      "Unable to process this msg at this time and need to send to dead queue/dynamoDB"
    );
  }
  console.log(`Processing message ${message} successfully.`);
};

let mapEventToDequeuedMessages = (event:SQSEvent) : DequeuedMessage[] => {
  return event.Records.map((record:SQSRecord) => {
    const message = JSON.parse(record.body);
    return <DequeuedMessage>{
      id: record.messageId,
      receiptHandle: record.receiptHandle,
      attributes: record.attributes,
      ...message,
    };
  });
};

export const main = middyfy(receiver);
