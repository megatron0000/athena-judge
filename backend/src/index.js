const { AttachPubSubListener } = require('./google-interface/pubsub')
const { getFileMIME, MIME, downloadFile } = require('./google-interface/drive')
const { submissionIsTurnedIn, assignGradeToSubmission, getSubmissionDriveFileIds } = require('./google-interface/classroom')
const request = require('request-promise-native')
const { resolve, dirname, join } = require('path')
const decompress = require('decompress')
const { unlink, readdir, stat } = require('promise-fs')
const { uploadCourseWorkSubmissionFiles } = require('./google-interface/cloudstorage')

/**
 *
 * @param {string} rootDir Directory under which to search for a file
 * @param {*} searchName Filename to be searched (like "main.cpp")
 * @returns {string[]} Absolute paths of all matching files found
 */
async function findFileRecursive(rootDir, searchName) {
  const filenames = await readdir(rootDir)
  const fileStats = await Promise.all(filename.map(file => stat(join(rootDir, file))))
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


if (module === require.main) {
  AttachPubSubListener(async notification => {
    const { collection } = notification
    if (collection !== 'courses.courseWork.studentSubmissions') {
      return
    }

    const { courseId, courseWorkId, id: submissionId } = notification.resourceId

    if (!await submissionIsTurnedIn(courseId, courseWorkId, submissionId)) {
      return
    }

    const driveFileIds = await getSubmissionDriveFileIds(courseId, courseWorkId, submissionId)

    const driveFileMimes = await Promise.all(driveFileIds.map(fileId => getFileMIME(courseId, fileId)))

    const compressedFileMimes = driveFileMimes
      .map((value, index) => { value, index })
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
        : 10 * testResults.filter(r => r).length / testResults.length

    await assignGradeToSubmission(courseId, courseWorkId, submissionId, grade)
  })
}
