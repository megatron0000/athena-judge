const { StartPubSub, AttachPubSubListener } = require('./google-interface/pubsub')
const { isCompressed, getFileName, downloadFile } = require('./google-interface/drive')
const { submissionIsTurnedIn, submissionIsReturned, assignGradeToSubmission, getSubmissionDriveFileIds } = require('./google-interface/classroom')
const request = require('request-promise-native')
const { resolve, join } = require('path')
const { unlink, readdir, stat } = require('promise-fs')
const decompress = require('decompress')
const { uploadCourseWorkSubmissionFiles } = require('./google-interface/cloudstorage')
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

/**
 *
 * @param {string} rootDir Directory under which to search for a file
 * @param {*} searchName Filename to be searched (like "main.cpp")
 * @returns {Promise<string[]>} Absolute paths of all matching files found
 */
async function findFileRecursive(rootDir, searchName) {
  const filenames = await readdir(rootDir)
  const fileStats = await Promise.all(filenames.map(file => stat(join(rootDir, file))))
  const dirs = []

  const result = []
  fileStats.forEach((fs, i) => {
    const filename = resolve(rootDir, filenames[i])

    if (fs.isFile() && filename.endsWith(searchName)) {
      result.push(filename)
    } else if (fs.isDirectory()) {
      dirs.push(findFileRecursive(filename, searchName))
    }
  });

  const subDirMatches = await Promise.all(dirs)
  return result.concat(...subDirMatches)
}

const run_endpoint = 'http://localhost:3001/run'
const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: {},
  json: true,
  timeout: 60000
}


const codeCorrectionLock = {
  STATE: {
    CORRECTED: 'corrected',
    DEFAULT: 'default',
    RETURNED: 'returned'
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
    this._populate({ courseId, courseWorkId, submissionId })
    this._map[courseId][courseWorkId][submissionId] = state
  }
}

/**
 * TODO: There are really lots of functionalities inside here: 
 * - Understading the submission format (.zip ? .tar ? etc.)
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

  if (await submissionIsReturned(courseId, courseWorkId, submissionId)) {
    codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.RETURNED })
  }

  if (!await submissionIsTurnedIn(courseId, courseWorkId, submissionId)) {
    console.log('submission is not turned in')
    return
  }

  if (codeCorrectionLock.get({ courseId, courseWorkId, submissionId }) === codeCorrectionLock.STATE.CORRECTED) {
    return
  }
  codeCorrectionLock.set({ courseId, courseWorkId, submissionId, state: codeCorrectionLock.STATE.CORRECTED })

  const driveFileIds = await getSubmissionDriveFileIds(courseId, courseWorkId, submissionId)

  const driveFileNames = await Promise.all(driveFileIds.map(fileId => getFileName(courseId, fileId)))

  const compressedFileNames = driveFileNames
    .map((name, index) => ({ name, index }))
    .filter(name_index => isCompressed(name_index.name))

  if (compressedFileNames.length === 0) {
    return await respondToStudent({
      error: 'Could not find compressed file in submission (no recognized compression format, at least)'
    })
  }

  if (compressedFileNames.length > 1) {
    return await respondToStudent({
      error: 'Found more than one compressed file in submission'
    })
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
    return respondToStudent({
      error: 'While decompressing submission: ' + (err.message || 'unknown error')
    })
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

  const { status, testResults } = await request(requestOptions)

  const grade = !status.ok
    ? 0.0
    : !testResults.length
      ? 10
      : 10 * testResults.filter(r => r.pass).length / testResults.length

  console.log(status)
  console.log(testResults)

  await assignGradeToSubmission(courseId, courseWorkId, submissionId, grade)

})

StartPubSub().then(() => console.log('Listening on Pub/Sub...'))

/**
 * 
 * @param {object} arg
 * @param {string} arg.error Optional. Error message (should be false-ish if no error)
 * @param {string=} arg.message Optional. Success message
 */
async function respondToStudent({ error, message }) {
  if (error) {
    console.error('backend found an error: ', error)
  } else {
    console.log('backend resulted: ', message)
  }
}