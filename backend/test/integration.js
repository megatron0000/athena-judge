const { getOAuth2ClientFromLocalCredentials } = require('../src/google-interface/credentials/auth')
const { google } = require('googleapis')
const { createReadStream } = require('fs')
const { resolve } = require('path')

let studentClassroom
let teacherClassroom
let studentDrive
let testCourseWorkId

describe('Integration', function () {
  this.timeout(60000)

  before(async () => {
    const studentAuth = await getOAuth2ClientFromLocalCredentials(
      undefined,
      process.env['CLASSROOM_TEST_COURSE_STUDENT_OAUTH_TOKEN_FILE']
    )
    studentClassroom = google.classroom({
      version: 'v1',
      auth: studentAuth
    })
    const teacherAuth = await getOAuth2ClientFromLocalCredentials(
      undefined,
      process.env['OAUTH_USER_TOKEN_FILE']
    )
    teacherClassroom = google.classroom({
      version: 'v1',
      auth: teacherAuth
    })

    studentDrive = google.drive({
      version: 'v3',
      auth: studentAuth
    })

  })

  it('should notice student submission, request code correction and give grade', async () => {
    const { data: courseWorkObj } = await teacherClassroom.courses.courseWork.create({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      requestBody: {
        description: 'Test assignment. Should be automatically removed',
        title: 'Test Assignment',
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED'
      }
    })
    testCourseWorkId = courseWorkObj.id

    console.log('created test coursework')

    const { data: driveFile } = await studentDrive.files.create({
      media: {
        mimeType: 'application/x-zip',
        body: createReadStream(resolve(__dirname, 'sample-files', 'wrong-submission', 'proj.zip'))
      }
    })

    console.log('created student drive file')

    const { data: submissionObj } = await studentClassroom.courses.coursework.studentSubmissions.list({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      courseWorkId: courseWorkObj.id,
      userId: 'me'
    })

    console.log('found submission')

    await studentClassroom.courses.courseWork.studentSubmissions.modifyAttachments({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      courseWorkId: courseWorkObj.id,
      id: submissionObj.id,
      requestBody: {
        addAttachments: [{
          driveFile: { id: driveFile.id }
        }]
      }
    })

    await studentClassroom.courses.courseWork.studentSubmissions.turnIn({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      courseWorkId: courseWorkObj.id,
      id: submissionObj.id
    })

    console.log('added files to submission')

    await teacherClassroom.courses.courseWork.delete({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      id: testCourseWorkId
    })
    await studentDrive.files.delete({
      fileId: driveFile.id
    })
  })


})