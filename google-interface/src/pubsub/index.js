/**
 * Listens for notifications in a specific Pub/Sub subscription
 */

const { PubSub } = require('@google-cloud/pubsub');
require('../credentials/config')

// Creates a client
const pubsub = new PubSub({
  projectId: process.env['GOOGLE_PROJECT_ID'],
  keyFilename: process.env['PUBSUB_LISTENER_SERVICEACCOUNT_CREDENTIALS']
});

/**
 * TODO(developer): Uncomment the following lines to run the sample.
 */
// const subscriptionName = 'my-sub';
// const timeout = 60;

// References an existing subscription
const subscription = pubsub.subscription(process.env['PUBSUB_SUBSCRIPTION']);

const listeners = []



exports.AttachPubSubListener = AttachPubSubListener
/**
 *
 * @param {(notification: any) => any} cb
 */
function AttachPubSubListener(cb) {
  listeners.push(cb)
}


// Create an event handler to handle messages
const messageHandler = async message => {
  /* console.log(`Received message ${message.id} (${new Date()}):`);
  console.log(`\tData: ${message.data}`);
  console.log(`\tAttributes: ${JSON.stringify(message.attributes)}\n`); */

  await Promise.all(listeners.forEach(listener => listener(message)))

  // "Ack" (acknowledge receipt of) the message
  message.ack();
};

// Listen for new messages until timeout is hit
subscription.on(`message`, messageHandler);

// setTimeout(() => {
//   subscription.removeListener('message', messageHandler);
//   console.log(`${messageCount} message(s) received.`);
// }, timeout * 1000);

exports.StopPubSub = StopPubSub
function StopPubSub() {
  return subscription.close()
}
