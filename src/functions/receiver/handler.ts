import { middyfy } from '@libs/lambda';
import { Context} from 'aws-lambda';
import { SQSEvent } from 'aws-lambda/trigger/sqs';
import { PartialFailureError } from './../../errors/partial-failure.error';
import { DequeuedMessage } from '../../models/queue.models';
import { deleteMessages, mapEventToDequeuedMessages, changeVisibilityMessages } from '../../utils/SQS.utils';
import { pushToDynamoDb } from '../../utils/dynamoDB.utils';
import { addExponentialBackOff, processMessage } from '../../utils/processing.utils';


const receiver = async (sqsEvent: SQSEvent, context:Context) => {
  const accountId = context.invokedFunctionArn.split(":")[4];
  let MESSAGE_QUEUE_URL = 'https://sqs.ap-south-1.amazonaws.com/' + accountId + '/MyQueue';
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
        if (parseInt(message.attributes.ApproximateReceiveCount) >= 4) {
          nonRetriableMessages.push(message);
        } else {
          retriableMessages.push(addExponentialBackOff(message));
        }
      } else {
        retriableMessages.push(addExponentialBackOff(message));
      }
    }
  });

  if (successfullyProcessedMessages.length > 0 || nonRetriableMessages.length > 0) {
    await deleteMessages([...successfullyProcessedMessages, ...nonRetriableMessages], MESSAGE_QUEUE_URL);
  }

  if (nonRetriableMessages.length > 0) { await pushToDynamoDb(nonRetriableMessages); }

  if (retriableMessages.length > 0) {
    if (retriableMessages.filter(ele => ele.VisibilityTimeout > 0).length > 0) {
      await changeVisibilityMessages(retriableMessages.filter(ele => ele.VisibilityTimeout > 0), MESSAGE_QUEUE_URL)
    };
    const errorMessage = `Failing due to ${retriableMessages} unsuccessful and retriable errors.`;
    console.log(errorMessage);
    throw new PartialFailureError(errorMessage);
  }
};

export const main = middyfy(receiver);
