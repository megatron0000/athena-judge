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
  'https://www.googleapis.com/auth/classroom.coursework.me'
];
exports.SCOPES = SCOPES

/**
 * Must be accessed via getProjectId()
 */
let _projIdCache

/**
 * @returns {Promise<string>}
 */
exports.getProjectId = async function getProjectId() {
  if (!_projIdCache) {
    const credContent = JSON.parse(
      await fs.readFile(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'])
    )
    _projIdCache = credContent.installed.project_id
  }

  return _projIdCache
}