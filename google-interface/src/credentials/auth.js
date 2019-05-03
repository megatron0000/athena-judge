/**
 * Function for a user to give permission to the app, using the
 * terminal (as opposed to using an http server with callback-uri)
 */

const { OAuth2Client } = require('googleapis-common')
const { SCOPES } = require('./config')

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const {
  google
} = require('googleapis')

const pubsub = require('@google-cloud/pubsub')
const gcs = require('../cloudstorage')

/**
 * Create an OAuth2Client from credentials in the local filesystem.
 * @param {string} oauthClientCredentialsPath Optional. If not supplied, it is infered from env vars
 * @param {string} oauthUserTokenPath Optional. If not supplied, it is infered from env vars
 * @returns {Promise<OAuth2Client>}
 */
exports.getOAuth2ClientFromLocalCredentials = function getOAuth2ClientFromLocalCredentials(
  oauthClientCredentialsPath,
  oauthUserTokenPath
) {
  oauthClientCredentialsPath = oauthClientCredentialsPath || process.env['OAUTH_CLIENT_CREDENTIALS_FILE']
  oauthUserTokenPath = oauthUserTokenPath || process.env['OAUTH_USER_TOKEN_FILE']

  function resolver(resolve, reject) {
    // Load client secrets from a local file.
    fs.readFile(oauthClientCredentialsPath, (err, credentials) => {
      if (err) {
        err.message = 'Error loading client oauth credentials file: ' + err.message
        return reject(err)
      }
      // Authorize a client with credentials
      authorize(JSON.parse(credentials), oauthUserTokenPath, resolve, reject)
    })
  }

  return new Promise(resolver)
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, userTokenPath, resolve, reject) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]); // does not throw

  // Check if we have previously stored a token.
  fs.readFile(userTokenPath, (err, token) => {
    if (err) return getNewToken(oAuth2Client, userTokenPath, resolve, reject)
    oAuth2Client.setCredentials(JSON.parse(token))
    resolve(oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {OAuth2Client} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client, userTokenPath, resolve, reject) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log('Authorize this app by visiting this url:', authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()

    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        err.message = 'Error retrieving access token: ' + err.message
        return reject(err)
      }
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(userTokenPath, JSON.stringify(token), (err) => {
        if (err) return reject(err)
        console.log('Token stored to', userTokenPath)
        resolve(oAuth2Client)
      })
    })
  })
}

/**
 * @type {{[courseId: string]: OAuth2Client}}
 */
const credcache = {}

/**
 * Creates an OAuth2Client based on courseId, by finding the credentials of the course teacher
 * stored on Cloud Storage
 * @param {string} courseId
 * @throws {Error} If no credentials are found in Cloud Storage for the specified course. 
 * This happens when the course's teacher had not previously given permissions to the application
 * 
 * TODO: The local credential cache may incur in problems if the credential is ever updated
 * solely on Cloud Storage
 */
exports.getOAuth2Client = async function getOAuth2Client(courseId) {
  if (!credcache[courseId]) {
    const tokenPath = path.resolve(__dirname, 'credcache', courseId.toString())

    const [token, clientCred] = await Promise.all([
      gcs.downloadTeacherCredential(courseId, tokenPath)
        .then(() => new Promise((resolve, reject) => {
          fs.readFile(tokenPath, (err, token) => {
            if (err) {
              reject(err)
            }
            return resolve(JSON.parse(token))
          })
        })),
      new Promise((resolve, reject) => {
        fs.readFile(process.env['OAUTH_CLIENT_CREDENTIALS_PATH'], (err, clientCred) => {
          if (err) {
            reject(err)
          }
          return resolve(JSON.parse(clientCred))
        })
      })
    ])

    const {
      client_secret,
      client_id,
      redirect_uris
    } = clientCred.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    oAuth2Client.setCredentials(token)

    credcache[courseId] = oAuth2Client

  }

  return credcache[courseId]
}