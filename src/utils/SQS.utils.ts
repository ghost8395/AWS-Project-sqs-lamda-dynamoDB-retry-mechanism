import { SQS } from 'aws-sdk';
import { SQSEvent, SQSRecord } from 'aws-lambda/trigger/sqs';
import {DequeuedMessage} from '../models/queue.models';
  
const sqs = new SQS();
  
export let deleteMessages = async (deleteMessageRequests: DequeuedMessage[], MESSAGE_QUEUE_URL): Promise<SQS.DeleteMessageBatchResult> => {
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
  
export let mapEventToDequeuedMessages = (event: SQSEvent): DequeuedMessage[] => {
    return event.Records.map((record: SQSRecord) => {
        const message = JSON.parse(record.body);
        return <DequeuedMessage>{
            id: record.messageId,
            receiptHandle: record.receiptHandle,
            attributes: record.attributes,
            ...message,
        };
    });
};
  
export let changeVisibilityMessages = async (messages: DequeuedMessage[], MESSAGE_QUEUE_URL): Promise<SQS.ChangeMessageVisibilityBatchResult> => {
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
  