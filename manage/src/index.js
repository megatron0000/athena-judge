
/**
 * TODO: Use promise-fs to avoid synchronous IO code
 */

require('./google-interface/credentials/config')
const { google } = require('googleapis')
const readline = require('readline')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { readFile } = require('promise-fs')
const { resolve, basename, dirname } = require('path')
const { getOAuth2ClientFromLocalCredentials } = require('./google-interface/credentials/auth')
const { getProjectId } = require('./google-interface/credentials/config')
const { spawn, exec } = require('child_process')

/**
 * Functions used internally. Should not be called for scripting
 */
const INTERNAL = {
  promisifiedReadlineInterface() {
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
  },

  async getOAuth2Client(oauthCredPath, scopes, readlineInterface, tokenDestinationPath) {
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

  },

  /**
 * 
 * @param {cloudresourcemanager_v1.Schema$Policy} projectPolicies 
 * @param {string} memberName Already in the format "serviceAccount:{email}" or analogous
 * @param {string} role "roles/pubsub.admin" or other one
 */
  addMemberToProjectRole_inplace(projectPolicies, memberName, role) {
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
  },

  /**
 * See https://github.com/adobe/helix-logging/blob/10f81c68f7b5672b902f00c9165a77682bf87658/src/google/iam.js
 * for the snippet used below.
 * And https://github.com/adobe/helix-logging/blob/10f81c68f7b5672b902f00c9165a77682bf87658/test/testGoogleIAM.js
 * for tests indicating the validity of this approach
 * @param {{privateKeyData: string, [key: string]: any}} credentialDownloadedThroughClientLib 
 */
  convertServiceAccountCredential(credentialDownloadedThroughClientLib) {
    return JSON.parse(
      Buffer
        .from(
          credentialDownloadedThroughClientLib.privateKeyData,
          'base64'
        )
        .toString('ascii')
    )
  },


  /**
   * Assumes the instance has 1 interface, which is a ONE_TO_ONE_NAT
   * @param {any} instanceObj 
   * @returns {string}
   */
  getInstanceIP(instanceObj) {
    return instanceObj.networkInterfaces[0].accessConfigs[0].natIP
  },

  /**
   * Invokes spawn() (from child_process module), piping stdout and stderr.
   * @returns {Promise<string>} On success, resolves with the stdout. On failure, rejects with the stderr
   */
  runPiped(command, args, withShell = true) {
    return new Promise((resolve, reject) => {

      let completeStdout = ''
      let completeStderr = ''

      // use shell to allow substitutions and other preprocessing facilities
      const child = spawn(command, args, { shell: withShell })

      child.stdout.on('data', data => {
        completeStdout += data.toString()
        console.log(data.toString().split('\n').map(line => 'CHILD_PROCESS STDOUT: ' + line).join('\n'))
      })

      child.stderr.on('data', data => {
        completeStderr += data.toString()
        console.log(data.toString().split('\n').map(line => 'CHILD_PROCESS STDERR: ' + line).join('\n'))
      })

      child.on('close', code => {
        console.log(`child_process exited with code ${code}`)
        child.unref()
        if (code) {
          return reject(completeStderr)
        }
        resolve(completeStdout)
      })
    })
  },

  /**
   * @returns {Promise<string>} On success, resolves with the stdout. On failure, rejects with the stderr
   */
  runCommandOverSSH(commandString, privateKeyPath, username, hostnameOrIP, withShell = false) {
    return INTERNAL.runPiped('ssh', [
      '-i', privateKeyPath, '-o', 'StrictHostKeyChecking=no',
      username + '@' + hostnameOrIP, 'set -x; ' + commandString
    ], withShell)
  },

  /**
   * Create an SSH keypair, returning the *contents* of the public key and the *path* to the
   * private key
   * @returns {Promise<{publicKey: string, privateKeyPath: string}>}
   */
  createSSHKey() {
    const privateKeyPath = '/tmp/key-' + new Date().toISOString()
    return new Promise((resolve, reject) => {
      exec(
        'ssh-keygen -t rsa -N "" -f ' + privateKeyPath + ' -C ""',
        async (err, stdout, stderr) => {
          if (err || stderr) {
            return reject(err || stderr)
          }
          const publicKey = (await readFile(privateKeyPath + '.pub', 'utf8')).trim()
          return resolve({
            publicKey,
            privateKeyPath
          })
        }
      )
    })
  },
  /**
   * Setup information needed to connect (over SSH) to a Compute Engine instance.
   */
  async setupInstanceConnection() {
    const auth = google.auth.fromJSON(JSON.parse(readFileSync(
      process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_CREDENTIALS'],
      'utf8'
    )))
    // @ts-ignore
    auth.scopes = ['https://www.googleapis.com/auth/cloud-platform']

    const compute = google.compute({
      version: 'v1',
      auth
    })

    const projId = await getProjectId()
    const instanceName = process.env['VM_INSTANCE_NAME']
    const zone = process.env['VM_ZONE']

    const { data: instanceObj } = await compute.instances.get({
      project: projId,
      zone,
      instance: instanceName
    })

    const instanceIP = INTERNAL.getInstanceIP(instanceObj)

    const vmAccountEmail = JSON.parse(readFileSync(
      process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_CREDENTIALS'],
      'utf8'
    )).client_email

    const oslogin = google.oslogin({
      version: 'v1',
      auth
    })

    const sshKeys = await INTERNAL.createSSHKey()

    const { data: vmLoginProfile } = await oslogin.users.importSshPublicKey({
      // @ts-ignore
      parent: 'users/' + vmAccountEmail,
      projectId: projId,
      requestBody: {
        key: sshKeys.publicKey,
        expirationTimeUsec: 1000 * (300000 + Date.now()) // Date.now() gives milliseconds. Set 300 seconds expiration
      }
    })

    const vmUsername = vmLoginProfile.loginProfile.posixAccounts[0].username

    // wait for key to be recognized by Google before returning to the caller
    while (
      await INTERNAL.runCommandOverSSH(
        'echo "Waiting SSH key establishment" ;',
        sshKeys.privateKeyPath,
        vmUsername,
        instanceIP
      )
        .then(stdout => false)
        .catch(stderr => {
          if (stderr.match('Connection refused') || stderr.match('Permission denied')) {
            return true
          }
          throw new Error('SSH command failed.')
        })
    ) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return {
      vmUsername,
      sshKeys,
      instanceIP,
      instanceName,
      zone,
      projId
    }

  }

}


/**
 * Call on the first project setup.
 * Activates all necessary google services.
 * @param {string} gitBranchName The deployed version of the code is taken from this branch
 */
async function setupProjectFirstTime(gitBranchName = 'master') {
  const prompt = INTERNAL.promisifiedReadlineInterface()

  console.log('Create a Google Cloud Platform Project through Google UI. Name it however you like.')
  console.log(
    'Generate an OAuth2 Client ID for it, download it as JSON and store it ' +
    'on the "src/credentials" directory inside the "google-interface" directory ' +
    '(absolute path ' + resolve(__dirname, '../google-interface/src/credentials') + ').'
  )
  console.log(
    'Name the file exactly "' + basename(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']) +
    '", without the quotes, though.'
  )
  await prompt.question(
    'Press Enter when you are done... (later, if asked to authorize this app, ' +
    'use the same Google Account with which you created the Google Platform Project)'
  )

  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform'
  ]

  const oauthCredPath = process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']

  const oauthTokenPath = process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']

  const auth = await INTERNAL.getOAuth2Client(
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

  // @ts-ignore
  writeFileSync(pubsubAccountKeyPath, JSON.stringify(INTERNAL.convertServiceAccountCredential(pubsubAccountKey)))

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

  writeFileSync(storageAccountKeyPath, JSON.stringify(INTERNAL.convertServiceAccountCredential(storageAccountKey)))

  console.log('Created Cloud Storage handling service account\n')

  console.log('Creating VM instance connector service account...')

  const vmAccountName = process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_DISPLAY_NAME']
  const vmAccountId = process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_ID']

  const { data: vmAccount } = await iam.projects.serviceAccounts.create({
    name: 'projects/' + projId,
    requestBody: {
      accountId: vmAccountId,
      serviceAccount: {
        displayName: vmAccountName
      }
    }
  })

  const { data: vmAccountKey } = await iam.projects.serviceAccounts.keys.create({
    name: 'projects/' + projId + '/serviceAccounts/' + vmAccount.email,
    requestBody: {
      privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
      keyAlgorithm: 'KEY_ALG_RSA_2048'
    }
  })

  const vmAccountKeyPath = process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_CREDENTIALS']

  // @ts-ignore
  writeFileSync(vmAccountKeyPath, JSON.stringify(INTERNAL.convertServiceAccountCredential(vmAccountKey)))

  console.log('Created VM instance connector service account\n')

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

  console.log('Defining Pub/Sub, Cloud Storage and Compute Engine service account permissions...')

  INTERNAL.addMemberToProjectRole_inplace(
    projPolicies,
    'serviceAccount:classroom-notifications@system.gserviceaccount.com',
    'roles/pubsub.publisher'
  )

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + pubsubAccount.email, 'roles/pubsub.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + storageAccount.email, 'roles/storage.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccount.email, 'roles/compute.osAdminLogin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccount.email, 'roles/compute.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccount.email, 'roles/iam.serviceAccountUser')

  await resourceManager.projects.setIamPolicy({
    resource: projId,
    requestBody: {
      policy: projPolicies
    }
  })

  console.log('Defined service accounts permissions\n')

  console.log('Creating compute engine instance and setting up (this may take a couple of minutes)...')

  await createAndSetupVM(gitBranchName)

  console.log('Code deployed and setup OK for VM instance\n')

}

/**
 * Creates a Compute Engine Instance and deploys code to it (from the project github repo).
 * @param {string} gitBranchName The branch from which to take the code that will be deployed to the VM
 */
async function createAndSetupVM(gitBranchName = 'master') {

  const prompt = INTERNAL.promisifiedReadlineInterface()
  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform'
  ]
  const oauthCredPath = process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']
  const oauthTokenPath = process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']
  const projId = await getProjectId()

  const auth = await INTERNAL.getOAuth2Client(
    oauthCredPath,
    scopes,
    prompt,
    oauthTokenPath
  )

  const instanceName = process.env['VM_INSTANCE_NAME']
  const zone = process.env['VM_ZONE']

  const compute = google.compute({
    version: 'v1',
    auth
  })

  // @ts-ignore
  let operation = await compute.instances.insert({
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
          },
          {
            key: 'enable-oslogin',
            value: 'TRUE'
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

  // @ts-ignore
  while (operation.data.status !== 'DONE') {
    await new Promise((resolve, reject) => {
      setTimeout(async () => {
        // @ts-ignore
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

  console.log('Deploying code and running setup in VM instance...')

  const vmAccountLocalCredJSON = JSON.parse(readFileSync(
    process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_CREDENTIALS'],
    'utf8'
  ))
  const vmAccountAuth = google.auth.fromJSON(vmAccountLocalCredJSON)
  const vmAccountEmail = vmAccountLocalCredJSON.client_email

  // @ts-ignore
  vmAccountAuth.scopes = ['https://www.googleapis.com/auth/cloud-platform']
  const oslogin = google.oslogin({
    version: 'v1',
    auth: vmAccountAuth
  })

  const { data: instanceObj } = await compute.instances.get({
    project: projId,
    zone,
    instance: instanceName
  })

  const instanceIP = INTERNAL.getInstanceIP(instanceObj)

  const sshKeys = await INTERNAL.createSSHKey()

  const { data: vmLoginProfile } = await oslogin.users.importSshPublicKey({
    // @ts-ignore
    parent: 'users/' + vmAccountEmail,
    projectId: projId,
    requestBody: {
      key: sshKeys.publicKey,
      expirationTimeUsec: 1000 * (300000 + Date.now()) // Date.now() gives milliseconds. Set 300 seconds expiration
    }
  })

  const vmUsername = vmLoginProfile.loginProfile.posixAccounts[0].username

  // keep trying to run command. This is because the VM instance takes some time to wake up
  while (
    await INTERNAL.runCommandOverSSH(
      'sudo apt-get update;' +
      'sudo apt-get install git-core -y;' +
      'git clone ' + process.env['PROJECT_GITHUB_HREF'] + ' athena-latest;' +
      'cd athena-latest;' +
      'git checkout ' + gitBranchName + ' ;' +
      'bash setup.sh;',
      sshKeys.privateKeyPath,
      vmUsername,
      instanceIP
    )
      .then(stdout => false)
      .catch(stderr => {
        if (stderr.match('Connection refused') || stderr.match('Permission denied')) {
          return true
        }
        throw new Error('SSH command failed.')
      })
  ) {
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  await uploadCredentials('athena-latest/google-interface/src/credentials')

}

/**
 * Example: cmdString="ls /" will list all content of the root directory of the remote VM instance.
 * By default, the working directory will be the home dir of the remote user
 */
async function runCommandOnVM(cmdString, withShell = false) {

  const { sshKeys, vmUsername, instanceIP } = await INTERNAL.setupInstanceConnection()

  await INTERNAL.runCommandOverSSH(
    cmdString,
    sshKeys.privateKeyPath,
    vmUsername,
    instanceIP,
    withShell
  )

  // oslogin.users.sshPublicKeys.delete({
  //   name: 'users/' + vmAccountEmail + '/sshPublicKeys/' + vmLoginProfile.loginProfile.sshPublicKeys[0].fingerprint
  // })

}

/**
 * Stops backend listener and runner
 * 
 * TODO: After implementing App Engine, stop it as well
 * 
 * TODO: Create a common .env so as to avoid hard-coding port numbers
 */
async function stopVMProcesses() {
  await runCommandOnVM(
    'echo "exit" > /dev/tcp/localhost/3000 ;' // stop backend, which will tell runner to stop as well
  ).catch(() => { })
}

/**
 * Runs all tests on the remote VM instance, piping the output (so it is visible if
 * errors occur).
 * Assumes all application processes are already running on the instance.
 * 
 * @param {string} remoteProjectDir Relative to the remote user home directory. In production,
 * it is "athena-latest"
 * @returns {Promise<boolean>} Whether all tests passed or not
 */
async function runTestsOnVM(remoteProjectDir) {
  let allTestsPassed = true

  await runCommandOnVM(
    'cd ' + remoteProjectDir + ' ;' +
    'cd google-interface/ ;' +
    'npm run test ;'
  ).catch(() => allTestsPassed = false)

  await runCommandOnVM(
    'cd ' + remoteProjectDir + ' ;' +
    'cd runner/ ;' +
    'npm run test ;'
  ).catch(() => allTestsPassed = false)

  await runCommandOnVM(
    'cd ' + remoteProjectDir + ' ;' +
    'cd backend/ ;' +
    'npm run test ;'
  ).catch(() => allTestsPassed = false)

  return allTestsPassed
}

/**
 * - stop running VM processes
 * - git clone to another temporary dir
 * - deploy credentials to it (therefore: TODO: refactor uploadCredentials())
 * - run tests
 * - if ok, rename the directory to make it official (athena-latest) and delete the old one. Run the new code
 * - else, just delete the temp dir. Rerun the original code. Report back the error
 */
async function deployToVM(branchName = 'master') {
  await stopVMProcesses()

  let allOK = false

  try {
    await runCommandOnVM(
      // remove old tmp dir, if present
      'rm -r athena-tmp-deploy || echo "bypass error" ;' +
      // fetch newest code
      'git clone ' + process.env['PROJECT_GITHUB_HREF'] + ' athena-tmp-deploy ;' +
      'cd athena-tmp-deploy ;' +
      'git checkout ' + branchName + ' ;' +
      // install npm dependencies
      'cd google-interface/ ;' +
      'npm install ;' +
      'cd ../backend ;' +
      'npm install ;' +
      'cd ../frontend ;' +
      'npm install ;' +
      'cd ../runner ;' +
      'npm install ;' +
      // build docker container (it will overwrite the production container-image, so we should reset it later)
      'cd docker ;' +
      'npm run build ;' +
      'cd ../../ ;' +
      // copy credentials
      'cp ../athena-latest/google-interface/src/credentials/*.json ./google-interface/src/credentials/ ;' +
      // run application processes
      'cd backend/ && screen -dm npm run dev ;' +
      'cd ../runner && screen -dm npm run dev ;'
    )

    const testsPassed = await runTestsOnVM('athena-tmp-deploy')

    await stopVMProcesses()

    allOK = testsPassed

  } catch (err) {
    allOK = false
  }


  if (!allOK) {
    // rebuild docker image; rerun production application processes
    await runCommandOnVM(
      'rm -r athena-tmp-deploy || echo "bypass error" ;' +
      'cd athena-latest/runner/docker && npm run build ;' +
      'cd ../../ ;' +
      'cd backend/ && screen -dm npm run prod ;' +
      'cd ../runner && screen -dm npm run prod ;'
    )
  } else {
    // make athena-tmp-deploy directory the production one
    await runCommandOnVM(
      'rm -r athena-latest ;' +
      'mv athena-tmp-deploy athena-latest ;' +
      'cd athena-latest ;' +
      'cd backend/ && screen -dm npm run prod ;' +
      'cd ../runner && screen -dm npm run prod ;'
    )
  }

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


/**
 * Upload local credential files to the VM instance running on Compute Engine,
 * overwriting credentials already contained in it, if any
 * 
 * @param {string} remoteDestDir Directory relative to the home of the remote user
 */
async function uploadCredentials(remoteDestDir) {

  const { vmUsername, instanceIP, sshKeys } = await INTERNAL.setupInstanceConnection()

  return INTERNAL.runPiped('scp', [
    '-i',
    sshKeys.privateKeyPath,
    '-o',
    'StrictHostKeyChecking=no',
    resolve(dirname(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']), '*.json'),
    vmUsername + '@' + instanceIP + ':' + remoteDestDir
  ])
}

async function getVMIpAddress() {
  const { instanceIP } = await INTERNAL.setupInstanceConnection()
  return instanceIP
}

if (require.main === module) {
  const args = {}
  
  args.command = process.argv[2]
  if (!args.command) {
    console.error('Need a command argument')
    process.exit(1)
  }

  switch (args.command) {
    case 'instance-ip':
      getVMIpAddress().then(IP => console.log(IP))
      break
    case 'setup-first-time':
      setupProjectFirstTime().then(() => console.log('\nProject setup complete. Exiting...'))
      break
    case 'deploy':
      args.branchName = process.argv[3] || 'master'
      deployToVM(args.branchName).then(() => console.log('Done. Exiting...'))
      break
    case 'upload-credentials':
      uploadCredentials('athena-latest').then(() => console.log('Done. Exiting...'))
      break
    case 'create-vm':
      args.branchName = process.argv[3] || 'master'
      createAndSetupVM(args.branchName).then(() => console.log('Done. Exiting...'))
      break
    default:
      console.error('Unrecognized command')
      process.exit(1)
  }
}

module.exports = {
  setupProjectFirstTime,
  stopVMProcesses,
  runCommandOnVM,
  uploadCredentials
}