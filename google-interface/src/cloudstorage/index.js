const GCS = require('./lib'); // GCS = Google Cloud Storage
const fs = require('promise-fs')
const path = require('path')
const { mkdirRecursive } = require('../mkdir-recursive')



/**
 * @returns {Promise<string[]>} filenames relative to the 'dir'
 * @param {string} dir
 */
const allFiles = async (dir) => {
  const dirContent = await fs.readdir(dir)
  const subDirsContent = []
  const fileList = []

  await Promise.all(dirContent.map(async cont => {
    const stat = await fs.stat(path.posix.join(dir, cont))

    if (stat.isFile()) {
      fileList.push(cont)
    } else if (stat.isDirectory()) {
      subDirsContent.push(
        allFiles(path.posix.join(dir, cont))
          .then(subfiles => subfiles.map(subfile => path.posix.join(cont, subfile)))
      )
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
  const cloudDirectory = path.posix.join(
    courseId,
    'courseWorks',
    courseWorkId,
    'submissions',
    submissionId
  )

  // first delete old submission. System must only store the latest submission files
  await deleteCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId)

  const files = await allFiles(localDirectory)

  return Promise.all(
    files.map(file =>
      GCS.uploadFile({
        localFilename: path.posix.join(localDirectory, file),
        destinationPath: path.posix.join(cloudDirectory, file)
      })
    )
  )
}

/**
 *
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {{input: string, output: string, isPrivate?: boolean, weight?: number}[]}  files
 */
function uploadCourseWorkTestFiles(courseId, courseWorkId, files) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  const uploads = []
  files.forEach((f, i) => {
    const uploadDir = path.posix.join(cloudDirectory, i.toString())

    uploads.push(GCS.uploadFile({
      localFilename: f.input,
      destinationPath: path.posix.join(uploadDir, 'input')
    }))
    uploads.push(GCS.uploadFile({
      localFilename: f.output,
      destinationPath: path.posix.join(uploadDir, 'output')
    }))
    uploads.push(GCS.uploadFile({
      content: JSON.stringify({ isPrivate: f.isPrivate || false, weight: f.weight || 1 }),
      destinationPath: path.posix.join(uploadDir, 'metadata')
    }))
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
  return GCS.uploadFile({
    localFilename: localCredentialPath,
    destinationPath: cloudPath
  })
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
 * @returns {Promise<boolean>} true if and only if the teacher's credential is already present in Cloud Storage
 */
function hasTeacherCredential(courseId) {
  return GCS
    .listFilesByPrefix(path.posix.join(courseId, 'teacherCredential.json'))
    .then(files => files && files.length > 0)
}

/**
 *
 * @param {string} courseId
 * @param {string} courseWorkId
 * @param {string} submissionId
 * @param {string} localDestinationDir
 */
async function downloadCourseWorkSubmissionFiles(courseId, courseWorkId, submissionId, localDestinationDir) {
  // make a dir even if no file will be downloaded
  await mkdirRecursive(localDestinationDir)
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
      path.posix.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    ))
  )
}

async function downloadCourseWorkTestFiles(courseId, courseWorkId, submissionId, localDestinationDir) {
  // make a dir even if no file will be downloaded
  await mkdirRecursive(localDestinationDir)
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
      path.posix.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    ))
  )
}


module.exports = {
  uploadCourseWorkSubmissionFiles,
  uploadCourseWorkTestFiles,
  uploadTeacherCredential,
  deleteCourseWorkSubmissionFiles,
  deleteCourseWorkTestFile,
  deleteCourseWorkTestFiles,
  deleteTeacherCredential,
  downloadTeacherCredential,
  downloadCourseWorkSubmissionFiles,
  downloadCourseWorkTestFiles,
  hasTeacherCredential
}
