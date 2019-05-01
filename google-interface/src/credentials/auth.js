/**
 * Function for a user to give permission to the app, using the
 * terminal (as opposed to using an http server with callback-uri)
 */

const { OAuth2Client } = require('googleapis-common')
const { SCOPES } = require('./config')

const fs = require('fs');
const path = require('path')
const readline = require('readline');
const {
  google
} = require('googleapis');

const pubsub = require('@google-cloud/pubsub')
const gcs = require('../cloudstorage')


// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const OAUTH_CLIENT_CREDENTIALS_PATH = process.env['OAUTH_CLIENT_CREDENTIALS_FILE']
const OAUTH_USER_TOKEN_FILE = process.env['OAUTH_USER_TOKEN_FILE']

/**
 * @return {Promise<OAuth2Client>}
 */
exports.Authenticate = function Authenticate() {
  function resolver(resolve, reject) {
    // Load client secrets from a local file.
    fs.readFile(OAUTH_CLIENT_CREDENTIALS_PATH, (err, credentials) => {
      if (err) {
        err.message = 'Error loading client oauth credentials file: ' + err.message
        return reject(err)
      }
      // Authorize a client with credentials, then call the Google Classroom API.
      authorize(JSON.parse(credentials), resolve, reject);
    });
  }

  return new Promise(resolver)
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
function authorize(credentials, resolve, reject) {
  const {
    client_secret,
    client_id,
    redirect_uris
  } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]); // does not throw

  // Check if we have previously stored a token.
  fs.readFile(OAUTH_USER_TOKEN_FILE, (err, token) => {
    if (err) return getNewToken(oAuth2Client, resolve, reject);
    oAuth2Client.setCredentials(JSON.parse(token));
    resolve(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
function getNewToken(oAuth2Client, resolve, reject) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();

    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        err.message = 'Error retrieving access token: ' + err.message
        return reject(err)
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(OAUTH_USER_TOKEN_FILE, JSON.stringify(token), (err) => {
        if (err) return reject(err);
        console.log('Token stored to', OAUTH_USER_TOKEN_FILE);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * @type {{[courseId: string]: OAuth2Client}}
 */
const credcache = {}

/**
 * @param {string} courseId
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
        fs.readFile(OAUTH_CLIENT_CREDENTIALS_PATH, (err, clientCred) => {
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