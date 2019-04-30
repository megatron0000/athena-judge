const assert = require('assert');
const { createReadStream, readFileSync, unlinkSync } = require('fs')
const { resolve } = require('path')
const drive = require('../src/drive')

require('../src/credentials/config');


describe('Drive', function () {

  this.timeout(60000);

  it('should download files', async () => {
    const content = 'my test content'
    const fileId = await drive.createFile(content)
    const localDestination = resolve(__dirname, 'sample-files', '.drivedownload')
    await drive.downloadFile(fileId, localDestination)
    await drive.deleteFile(fileId)
    assert.equal(
      readFileSync(localDestination),
      content,
      'Downloaded file has different content from uploaded one'
    )
    unlinkSync(localDestination)
  })

  it('should inform MIME type', async function () {
    const fileId = await drive.createFile(createReadStream(
      resolve(__dirname, 'sample-files', 'file4.zip')
    ))
    const mime = await drive.getFileMIME(fileId)
    assert.notEqual(
      drive.MIME.zip.indexOf(mime),
      -1,
      'Zip file MIME not correctly identified'
    )
  })


});
