import {DequeuedMessage} from '../models/queue.models';

let randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
  
export let addExponentialBackOff = (message :DequeuedMessage): DequeuedMessage => {
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
  
export let processMessage = (message: DequeuedMessage) => {
    if (message.nonRetriableMessage) {
        throw new Error(
            "Unable to process this msg at this time and need to send to dead queue/dynamoDB"
        );
    }
    console.log(`Processing message ${message} successfully.`);
};