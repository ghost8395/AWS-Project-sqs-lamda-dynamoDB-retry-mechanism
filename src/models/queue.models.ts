import { SQSRecordAttributes } from 'aws-lambda/trigger/sqs';

export interface DequeuedMessage {
    id: string;
    receiptHandle: string;
    attributes: SQSRecordAttributes;
    nonRetriableMessage?: boolean; //boolean which determines weather to fail the message or not
    VisibilityTimeout?: number;
}
  