require('../credentials/config')
const { google } = require('googleapis')
const { getOAuth2Client } = require('../credentials/auth')
const { getProjectId } = require('../credentials/config')


/**
 * 
 * @param {string} courseId 
 * @returns {Promise<import('googleapis').classroom_v1.Classroom>}
 */
async function classroom(courseId) {
  return google.classroom({
    version: 'v1',
    // @ts-ignore
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
  const classroomObj = await classroom(courseId)
  await classroomObj.courses.courseWork.studentSubmissions.patch({
    // @ts-ignore
    courseId,
    courseWorkId,
    id: submissionId,
    updateMask: 'assignedGrade,draftGrade',
    resource: {
      assignedGrade: grade,
      draftGrade: grade
    }
  })
  await classroomObj.courses.courseWork.studentSubmissions.return({
    courseId,
    courseWorkId,
    id: submissionId
  })
}

/**
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @returns {Promise<{name: string, email: string}>}
 */
exports.getStudentInfoFromSubmission = async function getStudentMailFromSubmission(courseId, courseWorkId, submissionId) {
  const classroomObj = await classroom(courseId)

  const { data: submission } = await classroomObj.courses.courseWork.studentSubmissions.get({
    courseId,
    courseWorkId,
    id: submissionId
  })

  const { userId } = submission
  const { data: studentObj } = await classroomObj.courses.students.get({ courseId, userId })
  const { emailAddress, name } = studentObj.profile

  return { name: name.fullName, email: emailAddress }
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

/**
 * @returns {Promise<string[]>}
 */
exports.getTeacherGids = async function getTeacherGids(courseId) {
  const classroomObj = await classroom(courseId)
  /**
   * @type {string[]}
   */
  let teacherGids = []
  let pageToken = ''

  do {
    const { data: teachersObj } = await classroomObj.courses.teachers.list({ courseId })

    teacherGids = teacherGids.concat(teachersObj.teachers.map(x => x.userId))
    pageToken = teachersObj.nextPageToken

  } while (pageToken)

  return teacherGids

}

exports.getCourseName = async function getCourseName(courseId) {
  const classroomObj = await classroom(courseId)

  const { data: courseObj } = await classroomObj.courses.get({
    id: courseId
  })

  return courseObj.name
}


/**
 * @param {string} courseId
 * @returns {Promise<{name: string, email: string}>}
 */
exports.getTeacherInfo = async function getTeacherInfo(courseId) {
  const classroomObj = await classroom(courseId)

  const { data: courseObj } = await classroomObj.courses.get({ id: courseId })

  const { data: profile } = await classroomObj.userProfiles.get({ userId: courseObj.ownerId })

  return { name: profile.name.fullName, email: profile.emailAddress }
}