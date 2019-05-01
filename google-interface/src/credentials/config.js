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
    // if is relative directory
    if (match[2].substr(0, 2) === './') {
      process.env[match[1]] = path.resolve(__dirname, match[2])
    } else {
      process.env[match[1]] = match[2]
    }
  })
}

configEnvironment()

// If modifying these scopes, delete user token credentials
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.push-notifications',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/classroom.coursework.me'
];
exports.SCOPES = SCOPES
