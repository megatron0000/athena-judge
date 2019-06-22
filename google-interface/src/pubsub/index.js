/**
 * Listens for notifications in a specific Pub/Sub subscription
 */

const { PubSub } = require('@google-cloud/pubsub')
const { getProjectId } = require('../credentials/config')

// must be accessed by getSubscription()
let subscription

async function getSubscription() {
  if (!subscription) {
    const projectId = await getProjectId()

    const pubsub = new PubSub({
      projectId: projectId,
      keyFilename: process.env['PUBSUB_LISTENER_SERVICEACCOUNT_CREDENTIALS']
    })

    subscription = pubsub.subscription(
      'projects/' + projectId + '/subscriptions/' + process.env['PUBSUB_SUBSCRIPTION_SHORTNAME']
    )
  }

  return subscription
}

const listeners = []

/**
*
* @param {(notification: any, ack: () => any) => any} cb
*/
exports.AttachPubSubListener = function AttachPubSubListener(cb) {
  listeners.push(cb)
}

exports.StartPubSub = async function StartPubSub() {
  (await getSubscription()).on('message', async message => {
    await Promise.all(listeners.map(listener => listener(message, () => message.ack())))
  })
}


exports.StopPubSub = async function StopPubSub() {
  const subscr = await getSubscription()
  return subscr.close()
}
