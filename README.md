# Serverless - Retry Mechanism with (aws-sqs-lamda-dynamoDB)

## Lambda function that processes jobs from a SQS queue.

## Resources used:
## Framework: You can use https://serverless-stack.com/ or https://www.serverless.com/
## Language: Typescript is preferred.
## AWS Services used: Lambda, SQS, DynamoDB
## Requirements:

### You’ll build a Lambda function (consumer) that consumes messages from a Standard SQS
queue. The consumer should be able to retry failed messages 3 times with exponential backoff
with a minimum 60 seconds interval. After 3 retries exhausted, it should save failed messages
into a DynamoDB table. The consumer should batch process 10 messages at a time and
should only reprocess failed messages.
### Tip: In your code, you can fail messages with some random logic to simulate error.
### Exponential backoff algorithm:
+ Where interval = 60 seconds, exponential rate is 1.5 and maximum retries count of 3.

| Run | Seconds | 
|-----|---------|
| 0   | 0.000   | 
| 1   | 60.000  |
| 2   | 150.000 | 

### Bonus point if you’re able to implement jitter with above logic so that all the failed messages are
not processed at the same time on each retry.


### Using NPM

- Run `npm i` to install the project dependencies
- Run `serverless config credentials --provider aws --key <keyid> --secret <secret> --profile <serverlessUser>` to config your credentials if you have not already with profile name 'serverlessUser'


## Test your service
- Run `serverless deploy` to install the project dependencies
- Run `serverless info` to install the project dependencies
- Run `serverless remove` to install the project dependencies

## Send Message service endpoint
Method: POST<br />
URL: URL from sender service<br />
Payload model:
```javascript
{
    nonRetriableMessage?: boolean; //boolean which determines weather to fail the message or not
    any : any
}
```
<br />Payload examples: 
```javascript
{
     message: "test111",
    "nonRetriableMessage":true 
}
```
