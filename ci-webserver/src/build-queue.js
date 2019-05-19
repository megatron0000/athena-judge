// For now, running test code in the Compute Engine VM instance must be done
// serially (one run at a time). Else, race conditions happen (see manage/ code)
// 
// Thus, this module facilitates running one test-run at a time

const { resolve } = require('path')
const { exec } = require('child_process')

function randomString() {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * @typedef  {object} TestSpec
 * @property {boolean} passed
 * @property {string} commitId
 * @property {string} logFile
 * @property {Date} issuedAt
 */

const buildQueue = {
  /**
   * @type {TestSpec[]}
   */
  _queue: [],
  /**
   * @type {Map<TestSpec, (passed: boolean) => any>}
   */
  _completionHooks: new Map(),
  _executing: false,

  /**
   * 
   * @param {TestSpec} item 
   */
  push(item) {
    this._queue.push(item)

    if (!this._executing) {
      this._triggerTestRun()
    }
  },

  /**
   * 
   * @param {TestSpec} item
   * @param {(passed: boolean) => any} callback 
   */
  onCompletion(item, callback) {
    this._completionHooks.set(item, callback)
  },
  _triggerTestRun() {

    this._executing = true
    const newSpec = this._queue.shift()
    runTestNow(newSpec).then(passed => {
      if (this._completionHooks.has(newSpec)) {
        this._completionHooks.get(newSpec)(passed)
        this._completionHooks.delete(newSpec)
      }

      if (this._queue.length) {
        this._triggerTestRun()
      } else {
        this._executing = false
      }
    })

  }
}

/**
 * @type {Map<string, Date>}
 */
const commit2Date = new Map()

/**
 * Returns a Promise that resolves when the scheduled test-run completes its execution.
 * 
 * Also synchronously updates the latest issue date of the commitId's test requests
 * 
 * @param {string} commitId
 * @returns {Promise<TestSpec>} Information the test-run, once it is completed
 */
function scheduleTestRun(commitId) {
  const newTestSpec = {
    commitId,
    passed: false,
    issuedAt: new Date(),
    logFile: resolve('/tmp', randomString())
  }

  buildQueue.push(newTestSpec)
  commit2Date.set(commitId, newTestSpec.issuedAt)

  return new Promise(resolve => buildQueue.onCompletion(newTestSpec, passed => {
    newTestSpec.passed = passed
    return resolve(newTestSpec)
  }))

}

/**
 * Modifies 'testSpec' in-place
 * @param {TestSpec} testSpec 
 * @returns {Promise<boolean>} true iff the tests passed
 */
function runTestNow(testSpec) {
  return new Promise(promiseResolve => {

    exec('node ' + resolve(__dirname, 'manage/index.js') + ' deploy ' + testSpec.commitId + ' test-only > ' + testSpec.logFile + ' 2>&1', {
      // 20 minutes timeout
      timeout: 1000 * 60 * 20,
      killSignal: 'SIGKILL',
      cwd: process.cwd()
    }, (err, stdout, stderr) => promiseResolve(err ? false : true))

  })
}

/**
 * Finds when 'commitId' was last scheduled for test-runs (in the lifetime of the application process,
 * meaning that this information is lost when the process terminates)
 * 
 * @returns {Date | null}
 */
function getMostRecentIssueDate(commitId) {
  return commit2Date.get(commitId)
}

exports.scheduleTestRun = scheduleTestRun
exports.getMostRecentIssueDate = getMostRecentIssueDate