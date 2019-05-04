const GCS = require('./lib'); // GCS = Google Cloud Storage
const fs = require('promise-fs')
const path = require('path')

/**
 * @returns {string[]} filenames relative to the 'dir'
 * @param {string} dir
 * @param {Promise<string[]>} fileList
 */
const allFiles = async (dir, fileList = []) => {
  const dirContent = await fs.readdir(dir)
  const subDirsContent = []
  const fileList = []

  await Promise.all(dirContent.map(async cont => {
    const stat = await fs.stat(cont)

    if (stat.isFile()) {
      fileList.push(cont)
    } else if (stat.isDirectory()) {
      subDirsContent.push(allFiles(path.join(dir, cont)))
    }
  }))

  const subDirsFiles = await Promise.all(subDirsContent)
  return fileList.concat(...subDirsFiles)
}


/**
 *
 * @param {*} courseId google-id
 * @param {*} courseWorkId google-id
 * @param {*} submissionId google-id
 * @param {*} localDirectory  path of the directory containing the student's submission files
 */
async function uploadCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId, localDirectory) {
  const cloudDirectory = path.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )
  const files = await allFiles(localDirectory)

  return Promise.all(
    files.map(file =>
      GCS.uploadFile(
        path.join(localDirectory, file),
        path.join(cloudDirectory, file)
      )))
}

/**
 *
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {{input: string; output: string}[]}  files
 */
function uploadCourseWorkTestFiles(courseId, courseWorkId, files) {
  const cloudDirectory = path.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  const uploads = []
  files.forEach((f, i) => {
    const uploadDir = path.join(cloudDirectory, i.toString())

    uploads.push(GCS.uploadFile(f.input, uploadDir, 'input'))
    uploads.push(GCS.uploadFile(f.output, uploadDir, 'output'))
  })

  return Promise.all(uploads)
}

/**
 *
 * @param {string} courseId google-id
 * @param {string} localCredentialPath path to local credential file
 */
function uploadTeacherCredential(courseId, localCredentialPath) {
  const cloudPath = path.posix.join(courseId, 'teacherCredential.json')
  return GCS.uploadFile(localCredentialPath, cloudPath)
}

/**
 *
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {string} submissionId google-id
 */
function deleteCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )

  return GCS.listFilesByPrefix(cloudDirectory).then(GCS.deleteFiles)
}

/**
 *
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {number} testNumber 0-based index of the test
 */
async function deleteCourseWorkTestFile(courseId, courseWorkId, testNumber) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'testFiles',
    testNumber.toString()
  )

  return GCS.listFilesByPrefix(cloudDirectory).then(GCS.deleteFiles)
}

/**
 *
 * @param {string} courseId
 * @param {string} courseWorkId
 */
function deleteCourseWorkTestFiles(courseId, courseWorkId) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'testFiles'
  )

  return GCS.listFilesByPrefix(cloudDirectory).then(GCS.deleteFiles)
}

/**
 *
 * @param {string} courseId
 */
function deleteTeacherCredential(courseId) {
  return GCS.deleteFile(path.posix.join(courseId, 'teacherCredential.json'))
}

/**
 *
 * @param {string} courseId
 * @param {string} localDestinationPath
 */
function downloadTeacherCredential(courseId, localDestinationPath) {
  return GCS.downloadFile(
    path.posix.join(courseId, 'teacherCredential.json'),
    localDestinationPath
  )
}

/**
 *
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @param {string} localDestinationDir
 */
async function downloadCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId, localDestinationDir) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )
  const filenames = await GCS.listFilesByPrefix(cloudDirectory)

  return Promise.all(
    filenames.map(filename => GCS.downloadFile(
      filename,
      path.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    ))
  )
}

async function downloadCourseWorkTestFiles(courseId, courseWorkId, submissionId, localDestinationDir) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'testFiles'
  )
  const filenames = await GCS.listFilesByPrefix(cloudDirectory)

  return Promise.all(
    filenames.map(filename => GCS.downloadFile(
      filename,
      path.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    ))
  )
}


exports.uploadCourseWorkSubmissionFiles = uploadCourseWorkSubmissionFiles
exports.uploadCourseWorkTestFiles = uploadCourseWorkTestFiles
exports.uploadTeacherCredential = uploadTeacherCredential
exports.deleteCourseWorkSubmissionFiles = deleteCourseWorkSubmissionFiles
exports.deleteCourseWorkTestFile = deleteCourseWorkTestFile
exports.deleteCourseWorkTestFiles = deleteCourseWorkTestFiles
exports.deleteTeacherCredential = deleteTeacherCredential
exports.downloadTeacherCredential = downloadTeacherCredential
exports.downloadCourseWorkSubmissionFiles = downloadCourseWorkSubmissionFiles
exports.downloadCourseWorkTestFiles = downloadCourseWorkTestFiles
