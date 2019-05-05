require('../credentials/config')
const { google } = require('googleapis')
const { getOAuth2Client } = require('../credentials/auth')
const {getProjectId} = require('../credentials/config')


/**
 * 
 * @param {string} courseId 
 */
async function classroom(courseId) {
  return google.classroom({
    version: 'v1',
    auth: await getOAuth2Client(courseId)
  })
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
        topicName: 'projects/' + (await getProjectId()) + '/topics/' + process.env['PUBSUB_TOPIC_SHORTNAME']
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
    updateMask: 'assignedGrade,draftGrade',
    resource: {
      assignedGrade: grade,
      draftGrade: grade
    }
  })
  await (await classroom(courseId)).courses.courseWork.studentSubmissions.return({
    courseId,
    courseWorkId,
    id: submissionId
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

exports.submissionIsTurnedIn = async function submissionIsTurnedIn(courseId, courseWorkId, submissionId) {
  const { data: submissionObj } = await (await classroom(courseId)).courses.courseWork.studentSubmissions.get({
    courseId,
    courseWorkId,
    id: submissionId
  })

  return submissionObj.state === 'TURNED_IN'
}

exports.submissionIsReturned = async function submissionIsTurnedIn(courseId, courseWorkId, submissionId) {
  const { data: submissionObj } = await (await classroom(courseId)).courses.courseWork.studentSubmissions.get({
    courseId,
    courseWorkId,
    id: submissionId
  })

  return submissionObj.state === 'RETURNED'
}

exports.getSubmissionDriveFileIds = async function getSubmissionDriveFileIds(courseId, courseWorkId, submissionId) {
  const { data: submissionObj } = await (await classroom(courseId)).courses.courseWork.studentSubmissions.get({
    courseId,
    courseWorkId,
    id: submissionId
  })

  return submissionObj
    .assignmentSubmission
    .attachments
    .filter(attachment => attachment.driveFile && true)
    .map(attachment => attachment.driveFile.id)
}