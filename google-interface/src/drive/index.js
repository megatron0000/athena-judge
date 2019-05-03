const { google } = require('googleapis')
const { getOAuth2Client } = require('../credentials/auth')
const { createWriteStream } = require('fs')
const { mkdirSync } = require('mkdir-recursive')
const { dirname } = require('path')

/**
 * 
 * @param {string} courseId 
 */
async function getDrive(courseId) {
  return google.drive({
    version: 'v3',
    auth: await getOAuth2Client(courseId)
  })
}

/**
 * @param {string} courseId
 * @param {string} fileId
 * @returns {string}
 */
exports.downloadFile = async function downloadFile(courseId, fileId, localDestinationPath) {
  mkdirSync(dirname(localDestinationPath))
  const drive = await getDrive(courseId)
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
 * @param {string | ReadableStream} content 
 * @returns {string} the created file id
 */
exports.createFile = async function createFile(courseId, content) {
  const drive = await getDrive(courseId)
  const response = await drive.files.create({
    media: {
      body: content
    }
  })
  return response.data.id
}

exports.deleteFile = async function deleteFile(courseId, fileId) {
  const drive = await getDrive(courseId)
  return drive.files.delete({ fileId })
}

exports.getFileMIME = async function getFileMIME(courseId, fileId) {
  const drive = await getDrive(courseId)
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
  ],
  tar: [
    'application/x-tar'
  ],
  gzip: [
    'application/x-gzip'
  ]
}