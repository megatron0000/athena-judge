const assert = require('assert');
const { createReadStream, readFileSync, unlinkSync } = require('fs')
const { resolve } = require('path')
const drive = require('../src/drive')

require('../src/credentials/config');

const testCourseId = process.env['CLASSROOM_TEST_COURSE_ID']

describe('Drive', function () {

  this.timeout(60000);

  it('should download files', async () => {
    const content = 'my test content'
    const fileId = await drive.createFile(testCourseId, content)
    const localDestination = resolve(__dirname, 'sample-files', '.drivedownload')
    await drive.downloadFile(testCourseId, fileId, localDestination)
    await drive.deleteFile(testCourseId, fileId)
    assert.equal(
      readFileSync(localDestination),
      content,
      'Downloaded file has different content from uploaded one'
    )
    unlinkSync(localDestination)
  })

  it('should inform MIME type', async function () {
    const fileIds = await Promise.all(
      ['file4.zip', 'file5.tar', 'file6.tar.gz']
        .map(fileName => drive.createFile(testCourseId, createReadStream(
          resolve(__dirname, 'sample-files', fileName)
        )))
    )
    const mimes = await Promise.all(
      fileIds.map(fileId => drive.getFileMIME(testCourseId, fileId))
    )
    assert.notEqual(
      drive.MIME.zip.indexOf(mimes[0]),
      -1,
      'Zip file MIME not correctly identified'
    )
    assert.notEqual(
      drive.MIME.tar.indexOf(mimes[1]),
      -1,
      'Tar file MIME not correctly identified'
    )
    assert.notEqual(
      drive.MIME.gzip.indexOf(mimes[2]),
      -1,
      'Gzip file MIME not correctly identified'
    )
    await Promise.all(fileIds.map(fileId => drive.deleteFile(testCourseId, fileId)))
  })


});
