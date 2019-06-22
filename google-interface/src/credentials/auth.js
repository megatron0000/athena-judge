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

const gcs = require('../cloudstorage')

/**
 * Create an OAuth2Client from credentials in the local filesystem.
 * @param {string} oauthClientCredentialsPath
 * @param {string} oauthUserTokenPath
 * @returns {Promise<OAuth2Client>}
 */
exports.getOAuth2ClientFromLocalCredentials = async function getOAuth2ClientFromLocalCredentials(
  oauthClientCredentialsPath,
  oauthUserTokenPath
) {
  if (!oauthClientCredentialsPath) {
    throw new Error('Did not supply oauthClientCredentialsPath')
  }
  if (!oauthUserTokenPath) {
    throw new Error('Did not supply oauthUserTokenPath')
  }

  const credentials = JSON.parse(await fs.readFile(oauthClientCredentialsPath))

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]); // does not throw

  const token = JSON.parse(await fs.readFile(oauthUserTokenPath))
  oAuth2Client.setCredentials(token)

  return oAuth2Client
}

/**
 * Creates an OAuth2Client based on courseId, by finding the credentials of the course teacher
 * stored on Cloud Storage
 * @param {string} courseId
 * @throws {Error} If no credentials are found in Cloud Storage for the specified course.
 * This happens when the course's teacher had not previously given permissions to the application
 *
 */
exports.getOAuth2ClientFromCloudStorage = async function getOAuth2ClientFromCloudStorage(courseId) {
  const [token, clientCred] = await Promise.all([
    gcs.downloadTeacherCredentialToMemory(courseId),
    fs.readFile(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']).then(JSON.parse)
  ])

  let {
    client_secret,
    client_id,
    redirect_uris
  } = clientCred.web

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
  oAuth2Client.setCredentials(token)

  return oAuth2Client

}
