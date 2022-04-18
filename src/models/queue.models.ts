import { SQSRecordAttributes } from 'aws-lambda/trigger/sqs';

export interface DequeuedMessage {
    id: string;
    receiptHandle: string;
    attributes: SQSRecordAttributes;
    nonRetriableMessage?: boolean;
    VisibilityTimeout?: number
}
  