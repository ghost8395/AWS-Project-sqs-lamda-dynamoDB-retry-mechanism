import { DequeuedMessage } from '../models/queue.models';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient(); 

export let pushToDynamoDb = async (nonRetriableMessages: DequeuedMessage[]): Promise<DynamoDB.DocumentClient.BatchWriteItemOutput> => {
    if (nonRetriableMessages.length <= 0) {
        return;
    }
    const timeStamp = new Date().getTime();
    let items: DynamoDB.DocumentClient.WriteRequest[] = nonRetriableMessages.map((ele) => {
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
  