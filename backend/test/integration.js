/// <reference types="mocha"/>
const { getOAuth2ClientFromLocalCredentials } = require('../src/google-interface/credentials/auth')
const { deleteCourseWorkTestFiles, uploadCourseWorkTestFiles, uploadTeacherCredential } = require('../src/google-interface/cloudstorage')
const { google } = require('googleapis')
const { createReadStream } = require('fs')
const { resolve } = require('path')
const assert = require('assert')

let studentClassroom
let teacherClassroom
let studentDrive
let testCourseWorkId
const sampleTestsDir = resolve(__dirname, 'sample-files/sample-tests')

const schedule = {
  _queue: [],
  /**
   * 
   * @param {(...args: any[]) => any} cb 
   */
  registerForLater(cb) {
    this._queue.push(cb)
  },
  executeScheduled() {
    return Promise.all(
      this._queue.map(cb => new Promise(async (resolve, reject) => {
        try {
          await cb()
          resolve(null)
        } catch (err) {
          Error.captureStackTrace(err, this)
          resolve(err)
        }
      }))
    )
      .then(results => {
        const errors = results.filter(result => result !== null)
        if (errors.length === 0) {
          return
        }

        const message = errors.map(err =>
          'Error in scheduled function: \n' + err.stack + '\n'
        ).join('\n')

        throw new Error(
          message +
          errors.length + ' out of ' + results.length + ' executeScheduled functions generated errors. See above.'
        )

      })
  }
}


/**
 * TODO: Test more cases: main.cpp inside folders, other compressed formats, etc.
 */
describe('Integration', function () {
  this.timeout(120000)

  afterEach(async () => {
    await schedule.executeScheduled()
  })

  before(async () => {
    const teacherAuth = await getOAuth2ClientFromLocalCredentials(
      process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
      process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
    )
    teacherClassroom = google.classroom({
      version: 'v1',
      auth: teacherAuth
    })

    const studentAuth = await getOAuth2ClientFromLocalCredentials(
      process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
      process.env['CLASSROOM_TEST_COURSE_STUDENT_OAUTH_TOKEN_FILE']
    )
    studentClassroom = google.classroom({
      version: 'v1',
      auth: studentAuth
    })
    studentDrive = google.drive({
      version: 'v3',
      auth: studentAuth
    })

    await uploadTeacherCredential(
      process.env['CLASSROOM_TEST_COURSE_ID'],
      process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
    )

  })

  it('should notice student submission, request code correction and give grade', async () => {
    const { data: courseWorkObj } = await teacherClassroom.courses.courseWork.create({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      requestBody: {
        description: 'Test assignment. Should be automatically removed',
        title: 'Test Assignment',
        workType: 'ASSIGNMENT',
        state: 'PUBLISHED',
        maxPoints: 10
      }
    })
    testCourseWorkId = courseWorkObj.id

    schedule.registerForLater(async () => {
      await teacherClassroom.courses.courseWork.delete({
        courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
        id: testCourseWorkId
      })
    })

    await uploadCourseWorkTestFiles(
      process.env['CLASSROOM_TEST_COURSE_ID'],
      courseWorkObj.id,
      [{
        input: resolve(sampleTestsDir, 'input0'),
        output: resolve(sampleTestsDir, 'output0')
      }, {
        input: resolve(sampleTestsDir, 'input1'),
        output: resolve(sampleTestsDir, 'output1')
      }]
    )

    schedule.registerForLater(async () => {
      await deleteCourseWorkTestFiles(courseWorkObj.courseId, courseWorkObj.id)
    })

    const { data: driveFile } = await studentDrive.files.create({
      media: {
        mimeType: 'application/x-zip',
        body: createReadStream(resolve(__dirname, 'sample-files', 'wrong-submission', 'proj.zip'))
      }
    })

    schedule.registerForLater(async () => {
      await studentDrive.files.delete({
        fileId: driveFile.id
      })
    })

    const { data: submissionResponse } = await studentClassroom.courses.courseWork.studentSubmissions.list({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      courseWorkId: courseWorkObj.id,
      userId: 'me'
    })

    const submissionObj = submissionResponse.studentSubmissions[0]

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

    let updatedStudentSubmission
    do {
      updatedStudentSubmission = (await studentClassroom.courses.courseWork.studentSubmissions.get({
        courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
        courseWorkId: courseWorkObj.id,
        id: submissionObj.id
      })).data
      await new Promise(resolve => setTimeout(resolve, 5000))
    } while (updatedStudentSubmission.state !== 'RETURNED')

    assert.equal(
      updatedStudentSubmission.assignedGrade,
      5
    )


  })


})