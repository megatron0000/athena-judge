const assert = require('assert')
const { createReadStream, readFileSync, unlinkSync } = require('fs')
const { resolve } = require('path')
const classroom = require('../src/classroom')

require('../src/credentials/config')


describe('Classroom', function () {

  this.timeout(60000)

  // it('should download submission files', async () => {
  //   const content = 'my test content'
  //   const fileId = await drive.createFile(content)
  //   const localDestination = resolve(__dirname, 'sample-files', '.drivedownload')
  //   await drive.downloadFile(fileId, localDestination)
  //   await drive.deleteFile(fileId)
  //   assert.equal(
  //     readFileSync(localDestination),
  //     content,
  //     'Downloaded file has different content from uploaded one'
  //   )
  //   unlinkSync(localDestination)
  // })


})
