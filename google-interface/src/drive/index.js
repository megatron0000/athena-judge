const { google } = require('googleapis')
const { getOAuth2ClientFromCloudStorage } = require('../credentials/auth')
const { createWriteStream, ReadStream } = require('fs')
const { dirname, extname } = require('path')
const { mkdirRecursive } = require('../mkdir-recursive')



/**
 * 
 * @param {string} courseId 
 */
async function getDrive(courseId) {
  return google.drive({
    version: 'v3',
    auth: await getOAuth2ClientFromCloudStorage(courseId)
  })
}

/**
 * @param {string} courseId
 * @param {string} fileId
 * @returns {string}
 */
async function downloadFile(courseId, fileId, localDestinationPath) {
  await mkdirRecursive(dirname(localDestinationPath))
  const drive = await getDrive(courseId)
  // ref: https://github.com/AfroMan94/lern2drive/blob/28dd6b7a8a4c9e3d42fcfc2b7189d96bdc3fc5d0/services/googleDrive/googleDrive.js
  const { data: stream } = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
  const writeStream = createWriteStream(localDestinationPath)
  return new Promise((resolve, reject) => {
    stream
      .pipe(writeStream)
      .on('error', reject)
      .on('close', resolve)
  })
}

/**
 * @param {string | ReadStream} content 
 * @returns {Promise<string>} the created file id
 */
async function createFile(courseId, content) {
  const drive = await getDrive(courseId)
  const response = await drive.files.create({
    media: {
      body: content
    }
  })
  return response.data.id
}

async function deleteFile(courseId, fileId) {
  const drive = await getDrive(courseId)
  return drive.files.delete({ fileId })
}

async function getFileName(courseId, fileId) {
  const drive = await getDrive(courseId)
  const response = await drive.files.get({ fileId })
  const file = response.data
  return file.name
}

function isCompressed(filename) {
  const extensions = ['.zip', '.tar', '.gz']
  return extensions.indexOf(extname(filename)) !== -1
}

module.exports = {
  getFileName,
  deleteFile,
  createFile,
  downloadFile,
  isCompressed
}