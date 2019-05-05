const { StartPubSub, AttachPubSubListener } = require('./google-interface/pubsub')
const { getFileMIME, MIME, downloadFile } = require('./google-interface/drive')
const { submissionIsTurnedIn, submissionIsReturned, assignGradeToSubmission, getSubmissionDriveFileIds } = require('./google-interface/classroom')
const request = require('request-promise-native')
const { resolve, dirname, join } = require('path')
const { unlink, readdir, stat } = require('promise-fs')
const decompress = require('decompress')
const { uploadCourseWorkSubmissionFiles } = require('./google-interface/cloudstorage')
const Emailer = require('./emailer');

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
  body: null,
  json: true
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

AttachPubSubListener(async notification => {
  notification = JSON.parse(notification.data.toString('utf8'))
  console.log(notification)
  const { collection } = notification
  if (collection !== 'courses.courseWork.studentSubmissions') {
    return
  }

  const { courseId, courseWorkId, id: submissionId } = notification.resourceId

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

  const driveFileMimes = await Promise.all(driveFileIds.map(fileId => getFileMIME(courseId, fileId)))

  const compressedFileMimes = driveFileMimes
    .map((value, index) => ({ value, index }))
    .filter(value_index => MIME.zip.concat(MIME.gzip, MIME.tar).indexOf(value_index.value) !== -1)

  if (compressedFileMimes.length === 0) {
    return console.error('Could not find compressed file in submission')
  }

  if (compressedFileMimes.length > 1) {
    return console.error('Found more than one compressed file in submission')
  }

  const compressedFileId = driveFileIds[compressedFileMimes[0].index]
  const compressedFileMime = compressedFileMimes[0].value
  const compressedFileFormat = MIME.zip.indexOf(compressedFileMime) !== -1
    ? '.zip'
    : MIME.tar.indexOf(compressedFileMime) !== -1
      ? '.tar'
      : '.tar.gzip'
  const tmpDir = resolve('/tmp', courseId, courseWorkId, submissionId)
  const localCompressedFilePath = join(tmpDir, compressedFileId + compressedFileFormat)

  await downloadFile(courseId, compressedFileId, localCompressedFilePath)

  await decompress(localCompressedFilePath, tmpDir)

  await unlink(localCompressedFilePath)

  const mainCppPaths = await findFileRecursive(tmpDir, 'main.cpp')

  if (mainCppPaths.length === 0) {
    return console.error('No main.cpp file found')
  }

  if (mainCppPaths.length > 1) {
    return console.error('More than one main.cpp file found')
  }

  await uploadCourseWorkSubmissionFiles(
    courseId,
    courseWorkId,
    submissionId,
    dirname(mainCppPaths[0])
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

  const emailer = new Emailer();
  emailer.sendStubEmail(); // TODO
})

StartPubSub().then(() => console.log('Listening on Pub/Sub...'))