/// <reference types="mocha"/>
const { getOAuth2ClientFromLocalCredentials } = require('../src/google-interface/credentials/auth')
const { deleteCourseWorkTestFiles, uploadCourseWorkTestFiles, uploadTeacherCredential } = require('../src/google-interface/cloudstorage')
const { createRegistration, submissionIsTurnedIn, assignGradeToSubmission } = require('../src/google-interface/classroom')
const { google } = require('googleapis')
const { createReadStream } = require('fs')
const { resolve, basename } = require('path')
const assert = require('assert')

let studentClassroom
let teacherClassroom
let studentDrive
let testCourseWorkId
const sampleTestsDir = resolve(__dirname, 'sample-files/sample-tests')

const schedule = {
  /**
   * @type {Array<(...args: any[]) => any>}
   */
  _queue: [],
  /**
   * 
   * @param {(...args: any[]) => any} cb 
   */
  registerForLater(cb) {
    this._queue.push(cb)
  },
  async executeScheduled() {
    const queueSnapshot = this._queue
    this._queue = []
    
    const results = []
    for (let i = 0; i < queueSnapshot.length; i++) {
      const cb = queueSnapshot[i]
      try {
        await cb()
        results.push(null)
      } catch (err) {
        results.push(err)
      }
    }

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
  }
}


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

    await createRegistration(process.env['CLASSROOM_TEST_COURSE_ID'])

  })

  it('should allow .zip containing single-file', async () => {
    await testWrongSubmission({ mimeType: 'application/x-zip', localFileName: 'proj-singlefile/proj.zip' })
  })

  it('should allow .tar containing single-file', async () => {
    await testWrongSubmission({ mimeType: 'application/x-tar', localFileName: 'proj-singlefile/proj.tar' })
  })

  it('should allow .tar.gz containing single-file', async () => {
    await testWrongSubmission({ mimeType: 'application/x-gzip', localFileName: 'proj-singlefile/proj.tar.gz' })
  })

  it('should allow .zip containing directory hierarchy', async () => {
    await testWrongSubmission({ mimeType: 'application/x-zip', localFileName: 'proj-hierarchy/proj.zip' })
  })

  it('should allow .tar containing directory hierarchy', async () => {
    await testWrongSubmission({ mimeType: 'application/x-tar', localFileName: 'proj-hierarchy/proj.tar' })
  })

  it('should allow .tar.gz containing directory hierarchy', async () => {
    await testWrongSubmission({ mimeType: 'application/x-gzip', localFileName: 'proj-hierarchy/proj.tar.gz' })
  })

})

/**
 * Submits a file and checks the code-correction
 * 
 * @param {object} args
 * @param {string} args.mimeType
 * @param {string} args.localFileName Relative to the wrong-submission dir
 */
async function testWrongSubmission({
  mimeType,
  localFileName
}) {
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
      mimeType,
      body: createReadStream(resolve(__dirname, 'sample-files', 'wrong-submission', localFileName))
    },
    requestBody: {
      name: basename(localFileName)
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

  // schedule.registerForLater(async () => {
  //   // Failure. Should have been returned
  //   if (await submissionIsTurnedIn(process.env['CLASSROOM_TEST_COURSE_ID'], courseWorkObj.id, submissionObj.id)) {
  //     // assigning grade returns the submission. 
  //     await assignGradeToSubmission(process.env['CLASSROOM_TEST_COURSE_ID'], courseWorkObj.id, submissionObj.id, 0)
  //     // then the student will own his file again, thus will be able to delete it
  //     await studentDrive.files.delete({
  //       fileId: driveFile.id
  //     })
  //   }
  // })

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
}