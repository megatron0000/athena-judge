const assert = require('assert')
const request = require('request-promise-native')
const { cloudstorage } = require('../src/google-interface')
const { resolve } = require('path')
const { readFileSync } = require('fs')

const run_endpoint = 'http://localhost:3001/run'

const testCourseId = 'test-course-id'
const testCourseWorkId = 'test-coursework-id'
const testSubmissionId = 'test-submission-id'
const sampleDir = resolve(__dirname, 'sample-files')
const sampleSubmissionsDir = resolve(sampleDir, 'sample-submissions')
const correctSubmissionDir = resolve(sampleSubmissionsDir, 'correct-submission')
const wrongSubmissionDir = resolve(sampleSubmissionsDir, 'wrong-submission')
const OOMSubmissionDir = resolve(sampleSubmissionsDir, 'out-of-mem-submission')
const timeoutSubmissionDir = resolve(sampleSubmissionsDir, 'infinite-loop-submission')
const uncompilableSubmissionDir = resolve(sampleSubmissionsDir, 'uncompilable-submission')
const crashingSubmissionDir = resolve(sampleSubmissionsDir, 'crashing-submission')
const sampleTestsDir = resolve(sampleDir, 'sample-tests')

function clone_obj(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: null,
  json: true,
  timeout: 60000 // milliseconds
}

describe('/run', function () {

  this.timeout(60000)

  it('should report correctly on correct source files', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        correctSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 1024
    }

    const response = await request(options)
    const [test0Response, test1Response] = response.testResults
    const { status } = response

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )


    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      test0Response.output
    )

    assert.equal(
      test1Response.expectedOutput,
      test1Response.output
    )

    assert.equal(
      test0Response.error,
      ''
    )

    assert.equal(
      test1Response.error,
      ''
    )

    assert.equal(
      test0Response.pass,
      true
    )

    assert.equal(
      test1Response.pass,
      true
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

  it('should report error on wrong source files', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        wrongSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 8
    }

    const response = await request(options)
    const [test0Response, test1Response] = response.testResults
    const { status } = response

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )

    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      test0Response.output
    )

    assert.notEqual(
      test1Response.expectedOutput,
      test1Response.output
    )

    assert.equal(
      test0Response.error,
      ''
    )

    assert.equal(
      test1Response.error,
      ''
    )

    assert.equal(
      test0Response.pass,
      true
    )

    assert.equal(
      test1Response.pass,
      false
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])


  })

  it('should report out-of-memory condition', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        OOMSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 8
    }

    const response = await request(options)
    const [test0Response, test1Response] = response.testResults
    const { status } = response

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )

    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.output,
      "Some output before the OOM\n"
    )

    assert.equal(
      test1Response.output,
      "Some output before the OOM\n"
    )

    assert.equal(
      test0Response.error.match('bad_alloc') && true,
      true
    )

    assert.equal(
      test1Response.error.match('bad_alloc') && true,
      true
    )

    assert.equal(
      test0Response.pass,
      false
    )

    assert.equal(
      test1Response.pass,
      false
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

  it('should report timeout condition', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        timeoutSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 2000,
      memLimitMB: 1024
    }

    const response = await request(options)
    const [test0Response, test1Response] = response.testResults
    const { status } = response

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )

    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.output,
      ''
    )

    assert.equal(
      test1Response.output,
      ''
    )

    assert.equal(
      test0Response.error,
      'Timeout'
    )

    assert.equal(
      test1Response.error,
      'Timeout'
    )

    assert.equal(
      test0Response.pass,
      false
    )

    assert.equal(
      test1Response.pass,
      false
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

  it('should allow multiple users at the same time', async () => {
    const anotherSubmissionId = 'another-test-id'
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        correctSubmissionDir
      ),
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        anotherSubmissionId,
        wrongSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 1024
    }
    const options1 = clone_obj(default_options)
    options1.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: anotherSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 1024
    }

    const responses = await Promise.all([request(options), request(options1)])
    const [test0Response, test1Response] = responses[0].testResults
    const [test0Response1, test1Response1] = responses[1].testResults
    const { status } = responses[0]
    const { status: status1 } = responses[1]

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )


    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      test0Response.output
    )

    assert.equal(
      test1Response.expectedOutput,
      test1Response.output
    )

    assert.equal(
      test0Response.error,
      ''
    )

    assert.equal(
      test1Response.error,
      ''
    )

    assert.equal(
      test0Response.pass,
      true
    )

    assert.equal(
      test1Response.pass,
      true
    )

    //

    assert.equal(
      status1.ok,
      true
    )

    assert.equal(
      status1.message,
      'All tests run'
    )

    assert.equal(
      test0Response1.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response1.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response1.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response1.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response1.expectedOutput,
      test0Response1.output
    )

    assert.notEqual(
      test1Response1.expectedOutput,
      test1Response1.output
    )

    assert.equal(
      test0Response1.error,
      ''
    )

    assert.equal(
      test1Response1.error,
      ''
    )

    assert.equal(
      test0Response1.pass,
      true
    )

    assert.equal(
      test1Response1.pass,
      false
    )


    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        anotherSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

  it('should warn if source is uncompilable', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        uncompilableSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 1024
    }

    const response = await request(options)
    const { status } = response

    assert.equal(
      status.ok,
      false
    )

    assert.equal(
      status.message.match('Compilation Error: ') && true,
      true
    )

    assert.equal(
      response.testResults.length,
      0
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

  it('should warn if program crashes', async () => {
    await Promise.all([
      cloudstorage.uploadCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId,
        crashingSubmissionDir
      ),
      cloudstorage.uploadCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId,
        [{
          input: resolve(sampleTestsDir, 'input0'),
          output: resolve(sampleTestsDir, 'output0')
        }, {
          input: resolve(sampleTestsDir, 'input1'),
          output: resolve(sampleTestsDir, 'output1')
        }]
      )
    ])

    const options = clone_obj(default_options)
    options.body = {
      courseId: testCourseId,
      courseWorkId: testCourseWorkId,
      submissionId: testSubmissionId,
      executionTimeout: 30000,
      memLimitMB: 1024
    }

    const response = await request(options)
    const [test0Response, test1Response] = response.testResults
    const { status } = response

    assert.equal(
      status.ok,
      true
    )

    assert.equal(
      status.message,
      'All tests run'
    )


    assert.equal(
      test0Response.input,
      readFileSync(resolve(sampleTestsDir, 'input0'))
    )

    assert.equal(
      test1Response.input,
      readFileSync(resolve(sampleTestsDir, 'input1'))
    )

    assert.equal(
      test0Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output0'))
    )

    assert.equal(
      test1Response.expectedOutput,
      readFileSync(resolve(sampleTestsDir, 'output1'))
    )

    assert.equal(
      test0Response.output,
      "Some output before the crash\n"
    )

    assert.equal(
      test0Response.error.match('terminate called after throwing') && true,
      true
    )

    assert.equal(
      test1Response.error.match('terminate called after throwing') && true,
      true
    )

    assert.equal(
      test0Response.pass,
      false
    )

    assert.equal(
      test1Response.pass,
      false
    )

    await Promise.all([
      cloudstorage.deleteCourseWorkSubmissionFiles(
        testCourseId,
        testCourseWorkId,
        testSubmissionId
      ),
      cloudstorage.deleteCourseWorkTestFiles(
        testCourseId,
        testCourseWorkId
      )
    ])
  })

})