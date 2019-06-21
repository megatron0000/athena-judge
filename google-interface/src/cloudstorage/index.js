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
 * Description of the tests to be uploaded. *input* and *output* are understood as paths in the local 
 * filesystem where the respective test contents are to be located
 */
async function uploadCourseWorkTestFiles(courseId, courseWorkId, files) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  // first delete current test files
  await GCS.listFilesByPrefix(cloudDirectory).then(GCS.deleteFiles)

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
      content: JSON.stringify({ isPrivate: f.isPrivate || false, weight: (f.weight === undefined) ? 1 : f.weight }),
      destinationPath: path.posix.join(uploadDir, 'metadata')
    }))
  })

  return Promise.all(uploads)
}

/**
 *
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {{input: string, output: string, isPrivate?: boolean, weight?: number}[]}  files 
 * Description of the tests to be uploaded. *input* and *output* are understood as the contents of the test
 * input and output
 */
async function uploadCourseWorkTestFilesFromMemory(courseId, courseWorkId, files) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  // first delete current test files
  await GCS.listFilesByPrefix(cloudDirectory).then(GCS.deleteFiles)

  const uploads = []
  files.forEach((f, i) => {
    const uploadDir = path.posix.join(cloudDirectory, i.toString())

    uploads.push(GCS.uploadFile({
      content: f.input,
      destinationPath: path.posix.join(uploadDir, 'input')
    }))
    uploads.push(GCS.uploadFile({
      content: f.output,
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
 * @param {string} courseId 
 * @param {string} access_token 
 * @param {string} refresh_token 
 */
function uploadTeacherCredentialFromMemory(courseId, access_token, refresh_token) {
  const cloudPath = path.posix.join(courseId, 'teacherCredential.json')
  return GCS.uploadFile({
    content: JSON.stringify({ access_token, refresh_token }),
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
 * @returns {Promise<{access_token: string, refresh_token: string}>}
 */
function downloadTeacherCredentialToMemory(courseId) {
  return GCS.downloadFile({
    srcFilename: path.posix.join(courseId, 'teacherCredential.json'),
    downloadToMemory: true
  }).then(buffer => buffer.toString()).then(JSON.parse)
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
    filenames.map(filename => GCS.downloadFile({
      srcFilename: filename,
      destFilename: path.posix.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    }))
  )
}

async function downloadCourseWorkTestFiles(courseId, courseWorkId, localDestinationDir) {
  // make a dir even if no file will be downloaded
  await mkdirRecursive(localDestinationDir)
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')
  const filenames = await GCS.listFilesByPrefix(cloudDirectory)

  return Promise.all(
    filenames.map(filename => GCS.downloadFile({
      srcFilename: filename,
      destFilename: path.posix.join(
        localDestinationDir,
        path.relative(cloudDirectory, filename)
      )
    }))
  )
}

/**
 * 
 * @param {string} courseId 
 * @param {string} courseWorkId 
 * @returns {Promise<{input: string, output: string, isPrivate: boolean, weight: number}[]>}
 */
async function downloadCourseWorkTestFilesToMemory(courseId, courseWorkId) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')
  const filenames = await GCS.listFilesByPrefix(cloudDirectory)
  const metadata = await downloadCourseWorkTestFilesMetadata(courseId, courseWorkId)

  return Promise.all(metadata.map(async (test, index) => {
    const in_out = await Promise.all([
      GCS.downloadFile({
        srcFilename: path.posix.join(cloudDirectory, index.toString(), 'input'),
        downloadToMemory: true
      }).then(buffer => buffer.toString()),
      GCS.downloadFile({
        srcFilename: path.posix.join(cloudDirectory, index.toString(), 'output'),
        downloadToMemory: true
      }).then(buffer => buffer.toString())
    ])

    return { input: in_out[0], output: in_out[1], isPrivate: test.isPrivate, weight: test.weight }
  }))
}

/**
 * @returns {Promise<{isPrivate: boolean, weight: number}[]>}
 */
function downloadCourseWorkTestFilesMetadata(courseId, courseWorkId) {
  const cloudDirectory = path.posix.join(courseId, 'courseWorks', courseWorkId, 'testFiles')

  const tests = []

  return GCS.listFilesByPrefix(cloudDirectory)
    .then(filenames => filenames
      .filter(filename => path.basename(filename) === 'metadata')
      .map(async filename => {
        // filename is of the form "<cloudDirectory>/X/metadata"
        const testNumber = parseInt(path.basename(path.dirname(filename)), 10) // the "X" in the above filename form

        tests[testNumber] = JSON.parse(
          await GCS.downloadFile({ srcFilename: filename, downloadToMemory: true }).then(x => x.toString())
        )
      }))
    .then(Promise.all.bind(Promise))
    .then(() => tests)

}


module.exports = {
  uploadCourseWorkSubmissionFiles,
  uploadCourseWorkTestFiles,
  uploadCourseWorkTestFilesFromMemory,
  uploadTeacherCredential,
  uploadTeacherCredentialFromMemory,
  deleteCourseWorkSubmissionFiles,
  deleteCourseWorkTestFile,
  deleteCourseWorkTestFiles,
  deleteTeacherCredential,
  downloadTeacherCredentialToMemory,
  downloadCourseWorkSubmissionFiles,
  downloadCourseWorkTestFiles,
  downloadCourseWorkTestFilesMetadata,
  downloadCourseWorkTestFilesToMemory,
  hasTeacherCredential
}
