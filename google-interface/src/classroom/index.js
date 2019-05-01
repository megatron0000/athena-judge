require('../credentials/config')
const { google } = require('googleapis')
const { getOAuth2Client } = require('../credentials/auth')

classroom_instance = null

/**
 * 
 * @param {string} courseId 
 */
async function classroom(courseId) {
  if (!classroom_instance) {
    classroom_instance = google.classroom({
      version: 'v1',
      auth: await getOAuth2Client(courseId)
    })
  }

  return classroom_instance
}

exports.createRegistration = async function createRegistration(courseId) {
  (await classroom(courseId)).registrations.create({
    requestBody: {
      cloudPubsubTopic: {
        topicName: process.env['PUBSUB_TOPIC']
      },
      feed: {
        feedType: 'COURSE_WORK_CHANGES',
        courseWorkChangesInfo: {
          courseId: courseId
        }
      }
    }
  })
}