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

/**
 * Once a registration is created for a course, the configured PubSub
 * topic will receive notifications every time a change occurs to the
 * course (like on student submissions)
 * 
 * @param courseId {string}
 */
exports.createRegistration = async function createRegistration(courseId) {
  await (await classroom(courseId)).registrations.create({
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

/**
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @param {number} grade
 */
exports.assignGradeToSubmission = async function assignGradeToSubmission(courseId, courseWorkId, submissionId, grade) {
  await (await classroom(courseId)).courses.courseWork.studentSubmissions.patch({
    courseId,
    courseWorkId,
    id: submissionId,
    updateMask: 'assignedGrade',
    resource: {
      assignedGrade: grade
    }
  })
}

/**
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 */
exports.getStudentMailFromSubmission = async function getStudentMailFromSubmission(courseId, courseWorkId, submissionId) {
  const { data: submission } = await (await classroom(courseId)).courses.courseWork.studentSubmissions.get({
    courseId,
    courseWorkId,
    id: submissionId
  })
  const { userId } = submission
  const { data: studentObj } = await (await classroom(courseId)).students.get({ courseId, userId })
  const { emailAddress } = studentObj.profile

  return emailAddress
}