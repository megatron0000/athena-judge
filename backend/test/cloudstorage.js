require('../credentials/config')

const assert = require('assert')

const fs = require('fs')
const path = require('path')

const storage = require('../cloudstorage/lib')

const testBucket = 'athena-mocha-test-bucket'

describe('Cloud Storage', function () {

  this.timeout(60000)

  it('should upload files', async () => {
    await Promise.all([
      storage.uploadFile(path.resolve(__dirname, 'sample-files', 'file1'), 'root/dir/file1'),
      storage.uploadFile(path.resolve(__dirname, 'sample-files', 'file2'), 'root/dir/file2')
    ])
  })

  it('should list and download files', async () => {

    assert.deepEqual(await storage.listFilesByPrefix('dir'), [])
    assert.deepEqual((await storage.listFilesByPrefix('root')).length, 2)

    await storage.downloadFile('root/dir/file1', path.resolve(__dirname, 'sample-files', 'file1.download'))

    assert.equal(
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file1.download'), 'utf8'),
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file1'), 'utf8')
    )

    fs.unlinkSync(path.resolve(__dirname, 'sample-files', 'file1.download'))

  })

  it('should delete files', async() => {

    await storage.deleteFiles(['root/dir/file1', '/root/dir/file2'])

    assert.deepEqual((await storage.listFilesByPrefix('root')), [])
  })

  //it('should delete')
})