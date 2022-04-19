# Serverless - Retry Mechanism with (aws-sqs-lamda-dynamoDB)
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