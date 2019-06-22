/// <reference types="mocha"/>

const assert = require('assert')

const request = require('request-promise-native')

const run_endpoint = 'http://localhost:8085/api'
const default_options = {
  method: 'POST',
  uri: run_endpoint,
  body: {},
  json: true,
  timeout: 60000
}

describe('Unauthorized requests', function () {
  this.timeout(120000)

  it('should be disallowed to fetch coursework test-files metadata', async () => {
    let statusCode = null
    try {
      await request({
        ...default_options,
        method: 'GET',
        uri: run_endpoint + '/assignments/test-files-metadata/placeholderCourseId/placeholderCourseWorkId'
      })
    } catch (err) {
      statusCode = err.statusCode
    }

    assert.equal(statusCode, 401)
  })

  it('should be disallowed to fetch coursework test-files content', async () => {
    let statusCode = null
    try {
      await request({
        ...default_options,
        method: 'GET',
        uri: run_endpoint + '/assignments/test-files/placeholderCourseId/placeholderCourseWorkId'
      })
    } catch (err) {
      statusCode = err.statusCode
    }

    assert.equal(statusCode, 401)
  })

  it('should be disallowed to update coursework test-files content', async () => {
    let statusCode = null
    try {
      await request({
        ...default_options,
        method: 'PUT',
        uri: run_endpoint + '/assignments/test-files/placeholderCourseId/placeholderCourseWorkId'
      })
    } catch (err) {
      statusCode = err.statusCode
    }

    assert.equal(statusCode, 401)
  })

  it('should be disallowed to check whether or not the system has credentials for a course', async () => {
    let statusCode = null
    try {
      await request({
        ...default_options,
        method: 'GET',
        uri: run_endpoint + '/courses/credentials/:courseId'
      })
    } catch (err) {
      statusCode = err.statusCode
    }

    assert.equal(statusCode, 401)
  })

  it('should be disallowed to provide credentials for system use', async () => {
    let statusCode = null
    try {
      await request({
        ...default_options,
        method: 'PUT',
        uri: run_endpoint + '/courses/credentials',
        body: { courseId: 'placeholderCourseId' }
      })
    } catch (err) {
      statusCode = err.statusCode
    }

    assert.equal(statusCode, 401)
  })

})
