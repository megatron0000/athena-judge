/**
 * Listens for notifications in a specific Pub/Sub subscription
 */

const { PubSub } = require('@google-cloud/pubsub');

// Creates a client
const pubsub = new PubSub();

/**
 * TODO(developer): Uncomment the following lines to run the sample.
 */
// const subscriptionName = 'my-sub';
// const timeout = 60;

// References an existing subscription
const subscription = pubsub.subscription('projects/ces29-athena/subscriptions/PenguinSubscription');

// Create an event handler to handle messages
let messageCount = 0;
const messageHandler = message => {
  console.log(`Received message ${message.id} (${new Date()}):`);
  console.log(`\tData: ${message.data}`);
  console.log(`\tAttributes: ${JSON.stringify(message.attributes)}`);
  messageCount += 1;

  // "Ack" (acknowledge receipt of) the message
  message.ack();
};

// Listen for new messages until timeout is hit
subscription.on(`message`, messageHandler);

// setTimeout(() => {
//   subscription.removeListener('message', messageHandler);
//   console.log(`${messageCount} message(s) received.`);
// }, timeout * 1000);
