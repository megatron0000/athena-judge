const express = require('express')
const bodyParser = require('body-parser')
const { scheduleTestRun, getMostRecentIssueDate, triggerTestRun } = require('./build-queue')
const { assignCommitStatus } = require('./github-status')

const app = express()

/**
 * TODO: List status of all commits being tested on the / route
 * (i.e. if they are waiting on line or being tested right now)
 */
app.get('/', (req, res) => {
  res
    .status(200)
    .send('Hello, world!\n')
    .end()
})

/**
 * TODO: Find out how to verify that the request indeed is from Github
 */
app.post(
  '/github-push',
  bodyParser.json(),
  async (req, res, next) => {
    if (req.headers['x-github-event'] === 'push') {
      return next()
    }

    console.log('Received non-push notification: ')
    console.log(req.body)
    res.status(200).end()
  },
  async (req, res) => {
    // acknowledge receipt. Later process the commits
    res.status(200).end()

    const pushEvent = req.body
    /**
     * May be empty (for instance, when the push is for a tag, instead of for a commit)
     * @type {string[]}
     */
    const commitIds = pushEvent.commits.map(commit => commit.id)

    console.log('Received test-run request for commit ids ' + commitIds.join(', '))

    for (let i = 0; i < commitIds.length; i++) {
      const commitId = commitIds[i]

      console.log('Scheduled commit ' + commitId)
      scheduleTestRun(commitId).then(testSpec => {
        console.log('Executed commit ' + testSpec.commitId + ' tests')
        if (testSpec.issuedAt.valueOf() >= getMostRecentIssueDate(commitId).valueOf()) {
          assignCommitStatus(
            commitId,
            testSpec.passed ? 'success' : 'failure',
            'Automated tests ' + (testSpec.passed ? 'passed' : 'did NOT pass'),
            testSpec.logFile
          )
        }
      })

      await assignCommitStatus(commitId, 'pending', 'CI server test results pending', undefined)
    }

    triggerTestRun()

  }
)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`CI server listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})