const fs = require('promise-fs')

/**
 * Environment variables and auth scopes.
 * 
 * Each script in need of env vars must call this one
 */

function configEnvironment() {
  const path = require('path')
  const fs = require('fs')

  const env = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8')
  env.split('\n').forEach(envLine => {
    // if is empty line
    if (envLine.trim() === '') {
      return
    }
    // if is commentary
    if (envLine[0] === '#') {
      return
    }

    // if is appropriately written (i.e. name=value)
    const match = envLine.match(/(.+?)=(.+)/)
    if (!match) {
      return
    }

    let name = match[1]
    let value = match[2]


    // if is relative directory
    if (value.substr(0, 2) === './') {
      process.env[name] = path.resolve(__dirname, value)
    } else {
      process.env[name] = value
    }
  })
}

configEnvironment()

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.push-notifications',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * Must not be accessed directly
 */
let _credCache

async function populateCredCache() {
  if (!_credCache) {
    const credContent = JSON.parse(
      await fs.readFile(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'])
    )
    _credCache = credContent.installed || credContent.web
  }
  return _credCache
}

/**
 * @returns {Promise<string>}
 */
async function getProjectId() {
  return (await populateCredCache()).project_id
}

async function getProjectOAuthClientId() {
  return (await populateCredCache()).client_id
}

async function getProjectOAuthClientSecret() {
  return (await populateCredCache()).client_secret
}

/**
 * Must be accessed via getGithubAccessToken()
 * @type {{token: string, user: string, repo: string}}
 */
let _githubAccessTokenCache

async function getGithubAccessToken() {
  if (!_githubAccessTokenCache) {
    _githubAccessTokenCache = JSON.parse(await fs.readFile(process.env['GITHUB_ACCESS_TOKEN']))
  }

  return _githubAccessTokenCache
}

async function getGithubRepoHref() {
  const token = await getGithubAccessToken()
  return 'https://github.com/' + token.user + '/' + token.repo
}


module.exports = {
  SCOPES,
  getProjectId,
  getProjectOAuthClientId,
  getProjectOAuthClientSecret,
  getGithubAccessToken,
  getGithubRepoHref
}