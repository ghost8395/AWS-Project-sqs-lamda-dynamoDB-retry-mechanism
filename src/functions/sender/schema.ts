export default {
  type: "object",
  properties: {
    message: { type: 'string' },
    nonRetriableMessage: { type: 'boolean' }
  },
  required: ['message']
};
