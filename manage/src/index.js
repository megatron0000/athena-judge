/**
 * TODO: Use promise-fs to avoid synchronous IO code
 */

require('./google-interface/credentials/config')
const { google } = require('googleapis')
const readline = require('readline')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { resolve, relative, basename } = require('path')
const { getOAuth2ClientFromLocalCredentials } = require('./google-interface/credentials/auth')
const { getProjectId } = require('./google-interface/credentials/config')

function promisifiedReadlineInterface() {
  const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return {
    /**
     * 
     * @param {string} msg
     * @param {string} defaultValue
     * @returns {Promise<string>}
     */
    question(msg, defaultValue = '') {
      return new Promise((resolve, reject) => {
        if (defaultValue) {
          msg = msg + '\n[[default=' + defaultValue + ']]\n>'
        } else {
          msg = msg + '\n>'
        }

        interface.question(msg, answer => {
          resolve(answer.trim() || defaultValue)
        })
      })
    },
    close() {
      interface.close()
    }
  }
}

async function getOAuth2Client(oauthCredPath, scopes, readlineInterface, tokenDestinationPath) {
  let oauthCred
  try {
    oauthCred = JSON.parse(readFileSync(oauthCredPath, 'utf8'))
  } catch (err) {
    throw new Error('Credential file was not found.')
  }

  const {
    client_secret,
    client_id,
    redirect_uris
  } = oauthCred.installed

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

  let token
  if (!existsSync(tokenDestinationPath)) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    })

    console.log('Authorize this app by visiting this url:', authUrl)
    const code = await readlineInterface.question('Enter the code from that page here: ')

    try {
      token = (await oAuth2Client.getToken(code)).tokens
    } catch (err) {
      throw new Error('Error retrieving access token: ' + err.message)
    }
    writeFileSync(tokenDestinationPath, JSON.stringify(token))

  } else {
    token = JSON.parse(readFileSync(tokenDestinationPath, 'utf8'))
  }

  oAuth2Client.setCredentials(token)
  return oAuth2Client

}

/**
 * 
 * @param {cloudresourcemanager_v1.Schema$Policy} projectPolicies 
 * @param {string} memberName Already in the format "serviceAccount:{email}" or analogous
 * @param {string} role "roles/pubsub.admin" or other one
 */
function addMemberToProjectRole_inplace(projectPolicies, memberName, role) {
  const existentBinding = projectPolicies.bindings.find(binding => binding.role === role)
  if (existentBinding) {
    if (existentBinding.members.indexOf(memberName) === -1) {
      existentBinding.members.push(memberName)
    }
  } else {
    projectPolicies.bindings.push({
      role,
      members: [memberName]
    })
  }
}

/**
 * See https://github.com/adobe/helix-logging/blob/10f81c68f7b5672b902f00c9165a77682bf87658/src/google/iam.js
 * for the snippet used below.
 * And https://github.com/adobe/helix-logging/blob/10f81c68f7b5672b902f00c9165a77682bf87658/test/testGoogleIAM.js
 * for tests indicating the validity of this approach
 * @param {{privateKeyData: string, [key: string]: any}} credentialDownloadedThroughClientLib 
 */
function convertServiceAccountCredential(credentialDownloadedThroughClientLib) {
  return JSON.parse(
    Buffer
      .from(
        credentialDownloadedThroughClientLib.privateKeyData,
        'base64'
      )
      .toString('ascii')
  )
}

/**
 * Assumes the instance has 1 interface, which is a ONE_TO_ONE_NAT
 * @param {any} instanceObj 
 * @returns {string}
 */
function getInstanceIP(instanceObj) {
  return instanceObj.networkInterfaces[0].accessConfigs[0].natIP
}

/**
 * Called on the first project setup.
 * Activates all necessary google services
 */
async function setupProjectFirstTime() {
  const prompt = promisifiedReadlineInterface()

  console.log('Create a Google Cloud Platform Project.')
  console.log(
    'Generate an OAuth2 Client ID for it, download it as JSON and store it ' +
    'on the "src/credentials" directory inside the "google-interface" directory ' +
    '(absolute path ' + resolve(__dirname, '../google-interface/src/credentials') + ').'
  )
  console.log(
    'Name the file exactly "' + basename(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']) +
    '", without the quotes, though.'
  )
  await prompt.question('Press Enter when you are done...')

  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform'
  ]

  const credentialsPath = resolve(__dirname, '../google-interface/src/credentials')

  const oauthCredPath = process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']

  const oauthTokenPath = process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']

  const auth = await getOAuth2Client(
    oauthCredPath,
    scopes,
    prompt,
    oauthTokenPath
  )

  const projId = await getProjectId()
  const projNumber = await prompt.question('Paste your project\'s number here (not project ID or project name): ')

  console.log('\nEnabling APIs (this may take a couple of minutes)...')

  const serviceusage = google.serviceusage({
    version: 'v1',
    auth
  })
  let operation = await serviceusage.services.batchEnable({
    parent: `projects/${projNumber}`,
    requestBody: {
      serviceIds: [
        'compute.googleapis.com',
        'drive.googleapis.com',
        'pubsub.googleapis.com',
        'classroom.googleapis.com',
        'storage-component.googleapis.com',
        'storage-api.googleapis.com',
        'iam.googleapis.com',
        'cloudresourcemanager.googleapis.com'
      ]
    }
  })

  if (operation.data.error) {
    throw new Error('Failed to enable APIs')
  }

  while (!operation.data.done) {
    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        operation = await serviceusage.operations.get({
          name: operation.data.name
        })
        if (operation.data.error) {
          return reject(new Error('Failed to enable APIs'))
        }
        return resolve()
      }, 5000)
    })
  }

  console.log('Enabled APIs\n')

  console.log('Creating Pub/Sub handling service account...')

  const resourceManager = google.cloudresourcemanager({
    version: 'v1',
    auth
  })

  const iam = google.iam({
    version: 'v1',
    auth
  })

  const { data: projPolicies } = await resourceManager.projects.getIamPolicy({
    resource: projId,
    requestBody: {}
  })

  const pubsubAccountName = process.env['PUBSUB_LISTENER_SERVICEACCOUNT_DISPLAY_NAME']
  const pubsubAccountId = process.env['PUBSUB_LISTENER_SERVICEACCOUNT_ID']

  const { data: pubsubAccount } = await iam.projects.serviceAccounts.create({
    name: 'projects/' + projId,
    requestBody: {
      accountId: pubsubAccountId,
      serviceAccount: {
        displayName: pubsubAccountName
      }
    }
  })

  const { data: pubsubAccountKey } = await iam.projects.serviceAccounts.keys.create({
    name: 'projects/' + projId + '/serviceAccounts/' + pubsubAccount.email,
    requestBody: {
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048'
    }
  })

  const pubsubAccountKeyPath = process.env['PUBSUB_LISTENER_SERVICEACCOUNT_CREDENTIALS']

  writeFileSync(pubsubAccountKeyPath, JSON.stringify(convertServiceAccountCredential(pubsubAccountKey)))

  console.log('Created Pub/Sub handling service account\n')

  console.log('Creating Cloud Storage handling service account...')


  const storageAccountName = process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_DISPLAY_NAME']
  const storageAccountId = process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_ID']

  const { data: storageAccount } = await iam.projects.serviceAccounts.create({
    name: 'projects/' + projId,
    requestBody: {
      accountId: storageAccountId,
      serviceAccount: {
        displayName: storageAccountName
      }
    }
  })

  const { data: storageAccountKey } = await iam.projects.serviceAccounts.keys.create({
    name: 'projects/' + projId + '/serviceAccounts/' + storageAccount.email,
    requestBody: {
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048'
    }
  })

  const storageAccountKeyPath = process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_CREDENTIALS']

  writeFileSync(storageAccountKeyPath, JSON.stringify(convertServiceAccountCredential(storageAccountKey)))

  console.log('Created Cloud Storage handling service account\n')

  console.log('Creating Pub/Sub topic and subscription...')

  const topicName = 'projects/' + projId + '/topics/' + process.env['PUBSUB_TOPIC_SHORTNAME']
  const subscriptionName = 'projects/' + projId + '/subscriptions/' + process.env['PUBSUB_SUBSCRIPTION_SHORTNAME']

  const pubsub = google.pubsub({
    version: 'v1',
    auth
  })

  await pubsub.projects.topics.create({
    name: topicName
  })

  await pubsub.projects.subscriptions.create({
    name: subscriptionName,
    requestBody: {
      topic: topicName,
      name: subscriptionName
    }
  })

  console.log('Created Pub/Sub topic and subscription\n')

  console.log('Defining Pub/Sub and Cloud Storage service account permissions...')

  addMemberToProjectRole_inplace(
    projPolicies,
    'serviceAccount:classroom-notifications@system.gserviceaccount.com',
    'roles/pubsub.publisher'
  )

  addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + pubsubAccount.email, 'roles/pubsub.admin')

  addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + storageAccount.email, 'roles/storage.admin')

  await resourceManager.projects.setIamPolicy({
    resource: projId,
    requestBody: {
      policy: projPolicies
    }
  })

  console.log('Defined service accounts permissions\n')

  console.log('Creating compute engine instance (this may take a couple of minutes)...')

  const instanceName = process.env['VM_INSTANCE_NAME']
  // const zone = "https://www.googleapis.com/compute/v1/projects/" + projId + "/zones/us-central1-a"
  const zone = process.env['VM_ZONE']

  const compute = google.compute({
    version: 'v1',
    auth
  })

  operation = await compute.instances.insert({
    project: projId,
    zone,
    requestBody: {
      disks: [
        {
          type: "PERSISTENT",
          boot: true,
          mode: "READ_WRITE",
          deviceName: instanceName,
          autoDelete: true,
          initializeParams: {
            sourceImage: "https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-minimal-1804-bionic-v20190306",
            diskType: "https://www.googleapis.com/compute/v1/projects/" + projId + "/zones/us-central1-a/diskTypes/pd-standard"
          }
        }
      ],
      networkInterfaces: [
        {
          network: "https://www.googleapis.com/compute/v1/projects/" + projId + "/global/networks/default",
          accessConfigs: [
            {
              name: "External NAT",
              type: "ONE_TO_ONE_NAT"//,
              //natIP: "104.197.91.147"
            }
          ]
        }
      ],
      metadata: {
        items: [
          {
            key: "startup-script",
            value: ""
          }
        ]
      },
      tags: {
        items: [
          "http-server",
          "https-server"
        ]
      },
      zone,
      canIpForward: false,
      scheduling: {
        preemptible: false,
        automaticRestart: true,
        onHostMaintenance: "MIGRATE"
      },
      name: instanceName,
      machineType: "https://www.googleapis.com/compute/v1/projects/" + projId + "/zones/us-central1-a/machineTypes/n1-standard-1",
      serviceAccounts: [
        {
          email: "default",
          scopes: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/devstorage.full_control",
            "https://www.googleapis.com/auth/taskqueue",
            "https://www.googleapis.com/auth/datastore",
            "https://www.googleapis.com/auth/logging.admin",
            "https://www.googleapis.com/auth/cloud-platform"
          ]
        }
      ]
    }
  })

  while (operation.data.status !== 'DONE') {
    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        operation = await compute.zoneOperations.get({
          project: projId,
          zone,
          operation: operation.data.name
        })
        if (operation.data.error) {
          return reject(new Error('Failed to enable APIs'))
        }
        return resolve()
      }, 5000)
    })
  }

  console.log('Created Compute Engine VM instance\n')

  return

  /**
   * TODO: Complete the setup by configuring VM instance and deploying for
   * the first time
   */

  google.oslogin({
    version: 'v1',
    auth
  })

  const instanceIP = getInstanceIP(await compute.instances.get({
    project: projId,
    zone,
    instance: instanceName
  }))



}

async function listTmpDriveFilesThatShouldBeDeleted() {

  const teacherAuth = await getOAuth2ClientFromLocalCredentials(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
  )
  const teacherDrive = google.drive({
    version: 'v3',
    auth: teacherAuth
  })

  const studentAuth = await getOAuth2ClientFromLocalCredentials(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    process.env['CLASSROOM_TEST_COURSE_STUDENT_OAUTH_TOKEN_FILE']
  )
  const studentDrive = google.drive({
    version: 'v3',
    auth: studentAuth
  })

  const { data: driveFiles } = await studentDrive.files.list({
    q: 'name = "Untitled" and mimeType = "application/x-zip"',
    fields: '*'
  })

  console.log(driveFiles)

  /* driveFiles.files.forEach(file => new Promise(async resolve => {
    await teacherDrive.files.delete({
      fileId: file.id
    })
    // to stay under google rate-limits 
    setTimeout(resolve, 50)
  })) */
}

if (require.main === module) {
  setupProjectFirstTime().then(() => console.log('Done. Exiting...'))
  // listTmpDriveFilesThatShouldBeDeleted().then(() => console.log('Done. Exiting...'))
}