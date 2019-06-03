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


});
