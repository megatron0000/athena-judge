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
    let match
    if (match = envLine.match(/(.+?)=(.+)/)) {
      process.env[match[1]] = path.resolve(__dirname, match[2])
    }
  })
}

configEnvironment()

// If modifying these scopes, delete user token credentials
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.profile.emails',
  'https://www.googleapis.com/auth/classroom.profile.photos',
  'https://www.googleapis.com/auth/classroom.push-notifications',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
];
exports.SCOPES = SCOPES
