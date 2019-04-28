const GCS = require('./lib.js'); // GCS = Google Cloud Storage
const fs = require('fs')
const path = require('path')

/**
 * @returns {string[]} filenames relative to the 'dir'
 * @param {string} dir 
 * @param {string[]} fileList 
 */
const allFilesSync = (dir, fileList = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)

    if (fs.statSync(filePath).isDirectory()) {
      allFilesSync(filePath).forEach(children => {
        fileList.push(path.join(file, children))
      })
    } else {
      fileList.push(file)
    }
  })
  return fileList
}


/**
 * 
 * @param {*} courseId google-id
 * @param {*} courseWorkId google-id
 * @param {*} submissionId google-id
 * @param {*} localDirectory  path of the directory containing the student's submission files
 */
async function uploadCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId, localDirectory) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )
  files = allFilesSync(localDirectory)

  await Promise.all(
    files.map(async file => {
      await GCS.uploadFile(
        path.join(localDirectory, file),
        path.posix.join(cloudDirectory, file)
      )
    })
  )
}

/**
 * 
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {{input: string; output: string}[]}  files
 */
async function uploadCourseWorkTestFiles(courseId, courseWorkId, files) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  await Promise.all(
    files.map(async (file, index) => {
      await Promise.all([
        GCS.uploadFile(file.input, path.posix.join(cloudDirectory, index, 'input')),
        GCS.uploadFile(file.output, path.posix.join(cloudDirectory, index, 'output'))
      ])
    })
  )
}

/**
 * 
 * @param {string} courseId google-id
 * @param {string} localCredentialPath path to local credential file
 */
async function uploadTeacherCredential(courseId, localCredentialPath) {
  const cloudPath = path.posix.join(courseId, 'teacherCredential.json')
  await GCS.uploadFile(localCredentialPath, cloudPath)
}

/**
 * 
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {string} submissionId google-id
 */
async function deleteCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )
  const submissionFiles = await GCS.listFilesByPrefix(cloudDirectory)
  await GCS.deleteFiles(submissionFiles)
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
    testNumber
  )
  const testFiles = GCS.listFilesByPrefix(cloudDirectory)
  await GCS.deleteFiles(testFiles)
}

/**
 * 
 * @param {string} courseId 
 */
async function deleteTeacherCredential(courseId) {
  await GCS.deleteFile(path.posix.join(courseId, 'teacherCredential.json'))
}

/**
 * 
 * @param {string} courseId 
 * @param {string} localDestinationPath 
 */
async function downloadTeacherCredential(courseId, localDestinationPath) {
  await GCS.downloadFile(
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
async function downloadSubmissionFiles(courseId, courseWorkId, submissionId, localDestinationDir) {
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )
  const filenames = await GCS.listFilesByPrefix(cloudDirectory)

  await Promise.all(
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
exports.deleteTeacherCredential = deleteTeacherCredential
exports.downloadTeacherCredential = downloadTeacherCredential
exports.downloadSubmissionFiles = downloadSubmissionFiles