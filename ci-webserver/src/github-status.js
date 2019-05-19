const request = require('request-promise-native')
const { getGithubAccessToken } = require('./manage/google-interface/credentials/config')
const { readFile } = require('promise-fs')
const AnsiToHtml = require('ansi-to-html')



/**
 * Facility for assigning a 'status' for a commit in Github
 * 
 * @param {string} commitId The github commit Id
 * @param {'pending' | 'failure' | 'success'} status The status label to mark the commit
 * @param {string} description Brief description for the status
 * @param {string | undefined} logFile Path to a file with more information, which will be published as a Github Gist
 */
async function assignCommitStatus(commitId, status, description, logFile) {
  const accessToken = await getGithubAccessToken()

  let gistUrl = undefined
  if (logFile) {
    const response = await request.post(
      'https://api.github.com/gists',
      {
        auth: {
          user: accessToken.user,
          password: accessToken.token
        },
        headers: {
          // Github requires a User-Agent
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        body: {
          description: "Athena Judge CI Server automated test logs",
          public: true,
          files: {
            'test-results.html': {
              content: (await readFile(logFile, 'utf8'))
                .split('\n')
                .map(line => new AnsiToHtml().toHtml(line)).join('<br>')
            }
          }
        },
        json: true
      }
    )

    gistUrl = 'https://gistcdn.githack.com' +
      response.files['test-results.html'].raw_url.slice('https://gist.githubusercontent.com'.length)
  }

  await request.post(
    'https://api.github.com/repos/' + accessToken.user + '/' + accessToken.repo + '/statuses/' + commitId,
    {
      auth: {
        user: accessToken.user,
        password: accessToken.token
      },
      headers: {
        // Github requires a User-Agent
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
      },
      body: {
        state: status,
        target_url: gistUrl,
        description,
        context: 'default'
      },
      json: true
    }
  )
}

exports.assignCommitStatus = assignCommitStatus