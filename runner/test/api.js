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
const sampleTestsDir = resolve(sampleDir, 'sample-tests')

function clone_obj(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: null,
  json: true
}

/* describe('/run', function () {

  this.timeout(60000)

  // mocha uses the number of arguments of the callback !
  it('should handle multiple users at once', async () => {
    const first_req = clone_obj(default_options)
    const second_req = clone_obj(default_options)
    first_req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Sou o cliente 1 !\" << endl; return 0;}",
      "input": "1"
    }
    second_req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Sou o cliente 2 !\" << endl; return 0;}",
      "input": "2"
    }
    const [
      first_body,
      second_body
    ] = await Promise.all([request(first_req), request(second_req)])

    assert.equal(first_body.data[0].data, 'Sou o cliente 1 !\n',
      'Client requests got mixed')
    assert.equal(second_body.data[0].data, 'Sou o cliente 2 !\n',
      'Client requests got mixed')
  })

  it('should set OutOfMemoryError on memory excess usage', async () => {
    const req = clone_obj(default_options)
    req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Another program is running !\" << endl; uint64_t*** tooLarge = new uint64_t**[1024]; for(int i = 0; i < 1024; i++) { tooLarge[i] = new uint64_t*[1024]; for(int j = 0; j < 2014; j++) { tooLarge[i][j] = new uint64_t[2014]; for (int k = 0; k < 1024; k++) { tooLarge[i][j][k] = 1; } } }  return 0;}",
      "input": "1"
    }

    const body = await request(req)
    assert.equal(body.error, 'OutOfMemoryError',
      'OutOfMemoryError was not set')
  })

  it('should set TimeLimitError on time excess usage', async () => {
    const req = clone_obj(default_options)
    req.body = {
      "source": "#include <iostream> \n using namespace std; \n int main() { cout << \"Another program is running !\" << endl; while(true) {} return 0;}",
      "input": "1"
    }

    const body = await request(req)
    assert.equal(body.error, 'TimeLimitError', 'TimeLimitError was not set')
  })

})
 */

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
})