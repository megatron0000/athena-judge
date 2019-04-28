const assert = require('assert');
const request = require('request-promise-native');
const drive = require('../drive')

require('../credentials/config');


describe('Drive', function () {

  this.timeout(60000);

  it('should download files', async () => {
    const content = 'my test content'
    const fileId = await drive.createFile(content)
    const downloaded_content = await drive.downloadFile(fileId)
    await drive.deleteFile(fileId)
    assert.equal(downloaded_content, content, 'Downloaded file has different content from uploaded one')
  })


});
