const { google } = require('googleapis')
const { Authenticate } = require('../credentials/auth')

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
exports.downloadFile = async function downloadFile(fileId) {
  const drive = await getDrive()
  const response = await drive.files.get({ fileId, alt: 'media' })
  return response.data
}

/**
 * @param content {string}
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
