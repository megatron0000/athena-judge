const { StartPubSub, AttachPubSubListener } = require('./google-interface/pubsub')
const { isCompressed, getFileName, downloadFile } = require('./google-interface/drive')
const { submissionIsTurnedIn, submissionIsReturned, assignGradeToSubmission, getSubmissionDriveFileIds } = require('./google-interface/classroom')
const request = require('request-promise-native')
const { resolve, join } = require('path')
const { unlink, readdir, stat } = require('promise-fs')
const decompress = require('decompress')
const { uploadCourseWorkSubmissionFiles } = require('./google-interface/cloudstorage')
const { sendCorrectionResultEmail, sendSubmissionAcknowledgeEmail } = require('./google-interface/gmail')
const { createServer } = require('net')

/**
 * Listen on a port for receiving exit commands
 */
// https://nodejs.org/dist/latest-v12.x/docs/api/net.html
const PORT = 3000
const portListener = createServer(socket => {

  socket.on('data', async data => {
    const dataString = data.toString().trim()

    if (dataString === 'exit') {
      await request({
        ...default_options,
        uri: 'http://localhost:3001/exit'
      })
      process.exit(0)
    }
  })

})

portListener.listen(PORT)

const run_endpoint = 'http://localhost:3001/run'
const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: {},
  json: true,
  timeout: 60000 * 60 // 1 hour (semi-infinite) timeout
}


const codeCorrectionLock = {
  STATE: {
    CORRECTING: 'correcting',
    CORRECTED: 'corrected',
    DEFAULT: 'default'
  },
  _map: {},
  _populate({ courseId, courseWorkId, submissionId }) {
    if (!this._map[courseId]) {
      this._map[courseId] = {}
    }
    if (!this._map[courseId][courseWorkId]) {
      this._map[courseId][courseWorkId] = {}
    }
    if (!this._map[courseId][courseWorkId][submissionId]) {
      this._map[courseId][courseWorkId][submissionId] = this.STATE.DEFAULT
    }
  },
  /**
   * @param {{courseId: string, courseWorkId: string, submissionId: string}} params
   */
  get({ courseId, courseWorkId, submissionId }) {
    this._populate({ courseId, courseWorkId, submissionId })
    return this._map[courseId][courseWorkId][submissionId]
  },
  set({ courseId, courseWorkId, submissionId, state }) {
    console.log('submission ' + submissionId + ' set to state ' + state)
    this._populate({ courseId, courseWorkId, submissionId })
    this._map[courseId][courseWorkId][submissionId] = state
  }
}

/**
 * TODO: There are really lots of functionalities inside here: 
 * - Understanding the submission format (.zip ? .tar ? etc.)
 * - Locking mechanism to avoid processing things more-than-once etc.
 * - Calculating grade based on test results
 * - Communicating any status (midway-failure or complete success) to the student who wubmitted
 */
AttachPubSubListener(async (notification, ack) => {
  notification = JSON.parse(notification.data.toString('utf8'))
  console.log(notification)
  const { collection } = notification
  if (collection !== 'courses.courseWork.studentSubmissions') {
    return ack()
  }

  const { courseId, courseWorkId, id: submissionId } = notification.resourceId

  // If we are in production and receive a notification for the test course, we know
  // a test is being run, so we do not acknowledge the notification
  if (courseId === process.env['CLASSROOM_TEST_COURSE_ID'] && process.env['NODE_ENV'].match('prod')) {
    return

  }
  // If we are NOT in production and receive a notification for anything other than the test course,
  // we are not entitled to answer it (since the production system should), so we avoid acknowledging the notification
  else if (courseId !== process.env['CLASSROOM_TEST_COURSE_ID'] && !process.env['NODE_ENV'].match('prod')) {
    return
  }

  ack()

  const turnedIn = await submissionIsTurnedIn(courseId, courseWorkId, submissionId)
  const isCorrected = codeCorrectionLock.get({ courseId, courseWorkId, submissionId }) === codeCorrectionLock.STATE.CORRECTED
  const isCorrecting = codeCorrectionLock.get({ courseId, courseWorkId, submissionId }) === codeCorrectionLock.STATE.CORRECTING

  if (turnedIn && isCorrected) {
    console.log('already corrected (but did not return yet) turned-in submission ' + submissionId)
    return
  } else if (!turnedIn && isCorrected) {
    console.log('seems like we returned submission ' + submissionId)
    codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.DEFAULT })
    return
  }
  // here we are sure it is either in CORRECTING or DEFAULT
  if (isCorrecting) {
    console.log('still correcting ' + submissionId)
    return
  }
  // here we are sure it is DEFAULT
  if (!turnedIn) {
    console.log('Will not correct because is not turned in: ' + submissionId)
    return
  }
  codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTING })

  await sendSubmissionAcknowledgeEmail(courseId, courseWorkId, submissionId)

  const driveFileIds = await getSubmissionDriveFileIds(courseId, courseWorkId, submissionId)

  const driveFileNames = await Promise.all(driveFileIds.map(fileId => getFileName(courseId, fileId)))

  const compressedFileNames = driveFileNames
    .map((name, index) => ({ name, index }))
    .filter(name_index => isCompressed(name_index.name))

  if (compressedFileNames.length === 0) {
    codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTED })
    await respondToStudent(courseId, courseWorkId, submissionId, {
      ok: false,
      message: 'Could not find compressed file in submission (no recognized compression format, at least)'
    }, [])
    await assignGradeToSubmission(courseId, courseWorkId, submissionId, 0)
    return
  }

  if (compressedFileNames.length > 1) {
    codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTED })
    await respondToStudent(courseId, courseWorkId, submissionId, {
      ok: false,
      message: 'Found more than one compressed file in submission'
    }, [])
    await assignGradeToSubmission(courseId, courseWorkId, submissionId, 0)
    return
  }

  const compressedFileId = driveFileIds[compressedFileNames[0].index]
  const compressedFileName = compressedFileNames[0].name

  const tmpSubmissionDir = resolve('/tmp', courseId, courseWorkId, submissionId)
  const localCompressedFilePath = join(tmpSubmissionDir, compressedFileId + '-' + compressedFileName)

  try {
    await downloadFile(courseId, compressedFileId, localCompressedFilePath)
    await decompress(localCompressedFilePath, tmpSubmissionDir)
    await unlink(localCompressedFilePath)
  } catch (err) {
    console.error(err)
    codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTED })
    await respondToStudent(courseId, courseWorkId, submissionId, {
      ok: false,
      message: 'While decompressing submission: ' + (err.message || 'unknown error')
    }, [])
    await assignGradeToSubmission(courseId, courseWorkId, submissionId, 0)
    return
  }

  await uploadCourseWorkSubmissionFiles(
    courseId,
    courseWorkId,
    submissionId,
    tmpSubmissionDir
  )

  const requestOptions = {
    ...default_options,
    body: {
      courseId,
      courseWorkId,
      submissionId,
      executionTimeout: 30000,
      memLimitMB: 256
    }
  }


  /**
   * @type {{status: Status, testResults: TestResult[]}}
   */
  const { status, testResults } = await request(requestOptions).catch(() => ({
    status: {
      ok: false,
      message: 'Athena crashed. This was not a problem with your submission, but with Athena itself'
    },
    testResults: []
  }))

  const grade = !status.ok
    ? 0.0
    : !testResults.length
      ? 10
      : 10 * testResults
        .filter(r => r.pass)
        .reduce((previous, current) => previous + current.weight, 0)
      / testResults.reduce((previous, current) => previous + current.weight, 0)

  console.log(status)
  console.log(testResults)

  codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTED })
  await respondToStudent(courseId, courseWorkId, submissionId, status, testResults)
  await assignGradeToSubmission(courseId, courseWorkId, submissionId, grade)

})

StartPubSub().then(() => console.log('Listening on Pub/Sub...'))

/**
 * 
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @param {Status} status 
 * @param {TestResult[]} testResults 
 */
function respondToStudent(courseId, courseWorkId, submissionId, status, testResults) {
  return sendCorrectionResultEmail(courseId, courseWorkId, submissionId, { status, testResults })
}

/**
   * @typedef {object} TestResult
   * @property {boolean} pass
   * @property {string} input
   * @property {string} expectedOutput
   * @property {string} output
   * @property {string} error
   * @property {boolean} isPrivate
   * @property {number} weight
   */
/**
 * @typedef {object} Status
 * @property {boolean} ok
 * @property {string} message
 * @property {string=} additionalInfo
 */