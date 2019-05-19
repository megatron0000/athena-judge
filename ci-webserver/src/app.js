const express = require('express')
const bodyParser = require('body-parser')
const request = require('request-promise-native')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const { getGithubAccessToken } = require('./google-interface').config

const app = express()

app.get('/', (req, res) => {
  res
    .status(200)
    .send('Hello, world!')
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
    const pushEvent = req.body
    /**
     * may be empty (for instance, when the push is for a tag, instead of for a commit)
     * 
     * @type {string[]}
     */
    const commitIds = pushEvent.commits.map(commit => commit.id)

    const accessToken = await getGithubAccessToken()

    commitIds.forEach(async commitId => {
      await request.post(
        'https://api.github.com/repos/' + accessToken.user + '/' + accessToken.repo + '/statuses/' + commitId,
        {
          auth: {
            user: accessToken.user,
            password: accessToken.token
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
          body: {
            state: 'failure',
            target_url: 'https://ces29-athena.appspot.com/',
            description: 'Testing CI server',
            context: 'default'
          },
          json: true
        }
      )

    })

    res.status(200).end()
  }
)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`CI server listening on port ${PORT}`)
  console.log('Press Ctrl+C to quit.')
})