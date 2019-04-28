require('../credentials/config')

const assert = require('assert')

const fs = require('fs')
const path = require('path')

const storage = require('../cloudstorage/lib')
const GCS = require('../cloudstorage')

const testBucket = 'athena-mocha-test-bucket'
const testCourseId = 'placeholder-course-id'
const testCourseWorkIds = ['first-placeholder-coursework-id', 'second-placeholder-coursework-id']
const testSubmissionIds = ['first-placeholder-submission-id', 'second-placeholder-submission-id']

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

  it('should delete files', async () => {

    await storage.deleteFiles(['root/dir/file1', '/root/dir/file2'])

    assert.deepEqual((await storage.listFilesByPrefix('root')), [])
  })

  it('should upload/download/delete teacher credential file', async () => {
    await GCS.uploadTeacherCredential(
      testCourseId,
      path.resolve(__dirname, 'sample-files', 'file1')
    )
    await GCS.downloadTeacherCredential(
      testCourseId,
      path.resolve(__dirname, 'sample-files', 'file1.download')
    )

    assert.equal(
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file1.download'), 'utf8'),
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file1'), 'utf8')
    )

    fs.unlinkSync(path.resolve(__dirname, 'sample-files', 'file1.download'))

    await GCS.deleteTeacherCredential(testCourseId)

    assert.equal(
      (await storage.listFilesByPrefix(path.posix.join(testCourseId, 'teacherCredential.json'))).length,
      0
    )

  })

  it('should upload/download/delete coursework submission files', async () => {
    await GCS.uploadCourseWorkSubmissionFiles(
      testCourseId,
      testCourseWorkIds[0],
      testSubmissionIds[0],
      path.resolve(__dirname, 'sample-files')
    )


    await GCS.downloadSubmissionFiles(
      testCourseId,
      testCourseWorkIds[0],
      testSubmissionIds[0],
      path.resolve(__dirname, 'sample-files', '.download')
    )

    assert.equal(
      fs.readFileSync(path.resolve(__dirname, 'sample-files', '.download', 'file1'), 'utf8'),
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file1'), 'utf8')
    )

    assert.equal(
      fs.readFileSync(path.resolve(__dirname, 'sample-files', '.download', 'file2'), 'utf8'),
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file2'), 'utf8')
    )

    assert.equal(
      fs.readFileSync(path.resolve(__dirname, 'sample-files', '.download', 'file3.txt'), 'utf8'),
      fs.readFileSync(path.resolve(__dirname, 'sample-files', 'file3.txt'), 'utf8')
    )

    fs.readdirSync(path.join(__dirname, 'sample-files', '.download'))
      .forEach(filename => fs.unlinkSync(path.join(__dirname, 'sample-files', '.download', filename)))
    fs.rmdirSync(path.resolve(__dirname, 'sample-files', '.download'))

    await GCS.deleteCourseWorkSubmissionFiles(
      testCourseId,
      testCourseWorkIds[0],
      testSubmissionIds[0]
    )

    assert.equal(
      (await storage.listFilesByPrefix(path.posix.join(
        testCourseId,
        'courseWorks',
        testCourseWorkIds[0],
        'submissions',
        testSubmissionIds[0]
      ))).length,
      0
    )

  })

})