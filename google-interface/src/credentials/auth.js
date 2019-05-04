/**
 * Function for a user to give permission to the app, using the
 * terminal (as opposed to using an http server with callback-uri)
 */

const { OAuth2Client } = require('googleapis-common')
const { SCOPES } = require('./config')

const fs = require('promise-fs')
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

  const  credentials = await fs.readFile(oauthClientCredentialsPath)

  return authorize(JSON.parse(credentials), oauthUserTokenPath)
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, userTokenPath) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); // does not throw

  try {
    const token = await fs.readFile(userTokenPath)
    oAuth2Client.setCredentials(JSON.parse(token))
    return oAuth2Client
  } catch {
    return getNewToken(oAuth2Client, userTokenPath)
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {OAuth2Client} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client, userTokenPath) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log('Authorize this app by visiting this url:', authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return rl.question('Enter the code from that page here: ', (code) => {
    rl.close()

      return oAuth2Client.getToken(code, async (err, token) => {
        if (err) {
          err.message = 'Error retrieving access token: ' + err.message
          throw err
        }
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        await fs.writeFile(userTokenPath, JSON.stringify(token))

        console.log('Token stored to', userTokenPath)
        return oAuth2Client
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
        .then(() => fs.readFile(tokenPath))
        .then(JSON.parse),
      fs.readFile(process.env['OAUTH_CLIENT_CREDENTIALS_PATH'])
        .then(JSON.parse)
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
