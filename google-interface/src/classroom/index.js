require('../credentials/config')
const { google } = require('googleapis')
const Authenticate = require('../credentials/auth').Authenticate

classroom_instance = null

async function classroom() {
  if (!classroom_instance) {
    const auth = await Authenticate()
    classroom_instance = google.classroom({
      version: 'v1',
      auth
    })
  }

  return classroom_instance
}

exports.createRegistration = async function createRegistration() {
  (await classroom()).registrations.create({
    requestBody: {
      cloudPubsubTopic: {
        topicName: process.env['PUBSUB_TOPIC']
      },
      feed: {
        feedType: 'COURSE_WORK_CHANGES',
        courseWorkChangesInfo: {
          courseId: process.env['CLASSROOM_TEST_COURSE_ID']
        }
      }
    }
  })
}