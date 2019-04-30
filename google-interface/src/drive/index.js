const { google } = require('googleapis')
const { Authenticate } = require('../credentials/auth')
const { createWriteStream } = require('fs')

drive_instance = null

async function getDrive() {
  if (!drive_instance) {
    const auth = await Authenticate()
    drive_instance = google.drive({
      version: 'v3',
      auth
    })
  }

  return drive_instance
}

/**
 * @param fileId {string}
 * @returns {string}
 */
exports.downloadFile = async function downloadFile(fileId, localDestinationPath) {
  const drive = await getDrive()
  // ref: https://github.com/AfroMan94/lern2drive/blob/28dd6b7a8a4c9e3d42fcfc2b7189d96bdc3fc5d0/services/googleDrive/googleDrive.js
  const { data: stream } = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
  return new Promise((resolve, reject) => {
    stream
      .on('error', reject)
      .on('end', resolve)
      .pipe(createWriteStream(localDestinationPath))
  })
}

/**
 * @param content {string | ReadableStream}
 * @returns {string} the created file id
 */
exports.createFile = async function createFile(content) {
  const drive = await getDrive()
  const response = await drive.files.create({
    media: {
      body: content
    }
  })
  return response.data.id
}

exports.deleteFile = async function deleteFile(fileId) {
  const drive = await getDrive()
  return drive.files.delete({ fileId })
}

exports.getFileMIME = async function getFileMIME(fileId) {
  const drive = await getDrive()
  const response = await drive.files.get({ fileId })
  const file = response.data
  return file.mimeType
}

exports.MIME = {
  zip: [
    'application/x-compressed',
    'application/x-zip-compressed',
    'application/zip',
    'multipart/x-zip',
    'application/x-zip'
  ]
}