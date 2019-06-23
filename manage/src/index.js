
/**
 * TODO: Use only promise-fs to avoid synchronous IO code
 */

require('./google-interface/credentials/config')
const { google } = require('googleapis')
const readline = require('readline')
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { readFile, writeFile } = require('promise-fs')
const { resolve, basename, dirname } = require('path')
const { getOAuth2ClientFromLocalCredentials, getOAuth2ClientFromCloudStorage } = require('./google-interface/credentials/auth')
const { getProjectId, getGithubRepoHref, SCOPES, getCloudstorageBucketName } = require('./google-interface/credentials/config')
const { spawn } = require('child_process')

// https://www.npmjs.com/package/ololog
// https://github.com/xpl/ansicolor#supported-styles
const log = require('ololog')

const { uploadTeacherCredential } = require('./google-interface/cloudstorage')
const { createRegistration } = require('./google-interface/classroom')

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

  async getOAuth2ClientInteractive(oauthCredPath, scopes, tokenDestinationPath) {
    const http = require('http')

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
    } = oauthCred.web

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    let token
    if (!existsSync(tokenDestinationPath)) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
      })

      await new Promise((resolve, reject) => {
        // make sure the route is visited only once
        let accessed = false
        try {
          const server = http.createServer(async (req, res) => {
            if (accessed) {
              return log.red('Route accessed more than once')
            }
            accessed = true
            res.end('Authentication successful. Please close the browser tab and return to the console')
            server.close()

            /**@type {string} */
            // @ts-ignore
            const code = require('url').parse(req.url, true).query.code
            const { tokens } = await oAuth2Client.getToken({ code })
            token = tokens
            writeFileSync(tokenDestinationPath, JSON.stringify(token))
            resolve()
          }).listen(8080, () => log.green('Authorize this app by visiting this url:', authUrl))
        } catch (err) {
          reject(err)
        }
      })

    } else {
      token = JSON.parse(readFileSync(tokenDestinationPath, 'utf8'))
    }

    oAuth2Client.setCredentials(token)
    return oAuth2Client

  },

  /**
   * @param {any} projectPolicies 
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
   * @param {number} timeout
   * @returns {Promise<string>} On success, resolves with the stdout. On failure, rejects with the stderr
   */
  runPiped(command, args, withShell = true, hideConsoleLogs = false, cwd = process.cwd(), timeout = undefined) {
    return new Promise((resolve, reject) => {

      let completeStdout = ''
      let completeStderr = ''

      if (!hideConsoleLogs) {
        log.yellow('launching child process for command "' + command + '" with args', args, 'and timeout', timeout)
      }

      // use shell to allow substitutions and other preprocessing facilities
      const child = spawn(command, args, { shell: withShell && '/bin/bash', cwd, detached: true })
      let timeoutHandle = null
      let killed = false

      child.stdout.on('data', data => {
        completeStdout += data.toString()
        if (!hideConsoleLogs) {
          log.cyan(data.toString().split('\n').map(line => 'CHILD_PROCESS STDOUT: ' + line).join('\n'))
        }
      })

      child.stderr.on('data', data => {
        completeStderr += data.toString()
        if (!hideConsoleLogs) {
          log.red(data.toString().split('\n').map(line => 'CHILD_PROCESS STDERR: ' + line).join('\n'))
        }
      })

      child.on('close', code => {
        if (timeoutHandle !== null) {
          clearTimeout(timeoutHandle)
        }

        if (!hideConsoleLogs) {
          log.yellow(`child process exited with code ${code}`)
        }

        child.unref()
        if (code || killed) {
          return reject(completeStderr)
        }
        resolve(completeStdout)
      })

      if (timeout) {
        timeoutHandle = setTimeout(() => {
          killed = true
          // kill the range (-PID) of the subprocess's group processes
          log.red('Child process killed because of user-supplied timeout (' + timeout + ' ms)')
          process.kill(-child.pid, 'SIGKILL')
        }, timeout)
      }
    })
  },

  /**
   * @returns {Promise<string>} On success, resolves with the stdout. On failure, rejects with the stderr
   */
  runCommandOverSSH(commandString, privateKeyPath, username, hostnameOrIP, hideConsoleLogs = false, timeout = undefined) {
    return INTERNAL.runPiped('ssh', [
      '-i', privateKeyPath, '-q', '-o', 'StrictHostKeyChecking no',
      username + '@' + hostnameOrIP, 'set -x; ' + commandString
    ], false, hideConsoleLogs, undefined, timeout)
  },

  /**
   * Create an SSH keypair, returning the *contents* of the public key and the *path* to the
   * private key
   * @returns {Promise<{publicKey: string, privateKeyPath: string}>}
   */
  async createSSHKey() {
    if (!existsSync('/tmp/athena-judge')) {
      mkdirSync('/tmp/athena-judge')
    }
    const privateKeyPath = '/tmp/athena-judge/key-' + new Date().toISOString()
    await INTERNAL.runPiped('bash', [
      '-c', 'ssh-keygen -t rsa -N "" -C "" -f ' + privateKeyPath
    ], false, true)
    const publicKey = (await readFile(privateKeyPath + '.pub', 'utf8')).trim()
    return {
      publicKey,
      privateKeyPath
    }
  },
  /**
   * @returns {Promise<boolean>} true if, and only if, the lock was acquired
   */
  async acquireVMLock() {
    try {
      await runCommandOnVM('mkdir /tmp/athena-judge-lockdir', true)
    } catch (err) {
      log.red('Failed to acquire VM lock. Already locked')
      return false
    }

    log.green('Success in acquiring VM lock')
    return true
  },
  async releaseVMLock() {
    try {
      await runCommandOnVM('rmdir /tmp/athena-judge-lockdir', true)
      log.green('Released VM lock')
    } catch (err) {
      log.red('Failed to release VM lock')
    }
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
    let trycount = 1
    while (
      await INTERNAL.runCommandOverSSH(
        'echo "Waiting SSH key establishment" ;',
        sshKeys.privateKeyPath,
        vmUsername,
        instanceIP,
        true,
        1000 * 60 // 1 minute timeout
      )
        .then(stdout => false)
        .catch(stderr => {
          if (trycount < 24) {
            trycount++
            log.green('Trying again (' + trycount + '/24) times')
            return true
          }
          throw new Error('SSH command failed. Tried 24 times (2 minutes)')
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

  },
  /**
   * Downloads the linux version of gcloud. For other environments, see
   * https://cloud.google.com/sdk/docs/downloads-versioned-archives.
   * 
   * Also appends the PATH and uses a service-account to authenticate gcloud
   */
  async downloadUncompressInstallGCloud() {
    const appPath = resolve(__dirname, '../../')
    const gcloudDownloadUrl = 'https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-247.0.0-linux-x86_64.tar.gz'
    await INTERNAL.runPiped('wget', [gcloudDownloadUrl, '-O', 'gcloud.tar.gz'], true, false, appPath)
    await INTERNAL.runPiped('tar', ['-xf', 'gcloud.tar.gz'], true, false, appPath)
    await INTERNAL.runPiped(
      'bash',
      ['google-cloud-sdk/install.sh', '--usage-reporting=false', '--quiet', '--path-update=true'],
      true,
      false,
      appPath
    )
    await INTERNAL.assertGCloudConfig()
  },
  async assertGCloudConfig() {
    const appPath = resolve(__dirname, '../../')
    process.env['PATH'] = resolve(appPath, 'google-cloud-sdk/bin') + ':' + process.env['PATH']
    await INTERNAL.runPiped('gcloud', ['config', 'set', 'project', await getProjectId()], true, false, appPath)
    await INTERNAL.runPiped('gcloud', [
      'auth',
      'activate-service-account',
      '--key-file',
      process.env['APPENGINE_HANDLER_SERVICEACCOUNT_CREDENTIALS']
    ], true, false)
  },
  /**
   * @returns {Promise<string>} Email of the created account
   */
  async createServiceAccount(displayName, id, outputKeyPath) {
    const prompt = INTERNAL.promisifiedReadlineInterface()
    const scopes = [
      'https://www.googleapis.com/auth/cloud-platform'
    ]
    const oauthCredPath = process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']
    const oauthTokenPath = process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']
    const projId = await getProjectId()
    const auth = await INTERNAL.getOAuth2ClientInteractive(
      oauthCredPath,
      scopes,
      oauthTokenPath
    )

    const iam = google.iam({
      version: 'v1',
      auth
    })

    const { data: account } = await iam.projects.serviceAccounts.create({
      name: 'projects/' + projId,
      requestBody: {
        accountId: id,
        serviceAccount: {
          displayName
        }
      }
    })

    const { data: accountKey } = await iam.projects.serviceAccounts.keys.create({
      name: 'projects/' + projId + '/serviceAccounts/' + account.email,
      requestBody: {
        privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
        keyAlgorithm: 'KEY_ALG_RSA_2048'
      }
    })

    //@ts-ignore
    writeFileSync(outputKeyPath, JSON.stringify(INTERNAL.convertServiceAccountCredential(accountKey)))

    return account.email
  },

  /**
 * Runs all tests on the remote VM instance, piping the output (so it is visible if
 * errors occur).
 * 
 * Assumes the 'remoteProjectDir' contains a valid copy of the codebase, the one to be
 * executed and tested.
 * 
 * Does not leave side effects (i.e. stops all application processes it started)
 * 
 * Assumes the VM is not locked (does not acquire the lock by itself, since deployToVM
 * already does this, and recursive locks are not supported)
 * 
 * @param {string} remoteProjectDir Relative to the remote user home directory. In production,
 * it is "athena-latest"
 * @returns {Promise<boolean>} Whether all tests passed or not
 */
  async runTestsOnVM(remoteProjectDir, timeout = undefined) {

    await stopVMProcesses()

    let allTestsPassed = true

    await runCommandOnVM(
      'cd ' + remoteProjectDir + ' ;' +
      'cd google-interface/ ;' +
      'npm run test ;',
      undefined,
      timeout
    ).catch(() => allTestsPassed = false)

    // run application processes
    await runCommandOnVM(
      'cd ' + remoteProjectDir + ' ;' +
      'cd listener/ && screen -Logfile /usr/local/lib/athena-judge/listener-test.log -dmL /bin/bash -c "npm run dev | ts" ;' +
      'cd ../runner && screen -Logfile /usr/local/lib/athena-judge/runner-test.log -dmL /bin/bash -c "npm run dev | ts" ;' +
      'cd ../backend && screen -Logfile /usr/local/lib/athena-judge/backend-test.log -dmL /bin/bash -c "npm run dev | ts" ;',
      undefined,
      timeout
    )

    await runCommandOnVM(
      'cd ' + remoteProjectDir + ' ;' +
      'cd runner/ ;' +
      'npm run test ;',
      undefined,
      timeout
    ).catch(() => allTestsPassed = false)

    await runCommandOnVM(
      'cd ' + remoteProjectDir + ' ;' +
      'cd backend/ ;' +
      'npm run test ;',
      undefined,
      timeout
    ).catch(() => allTestsPassed = false)

    await runCommandOnVM(
      'cd ' + remoteProjectDir + ' ;' +
      'cd listener/ ;' +
      'npm run test ;',
      undefined,
      timeout
    ).catch(() => allTestsPassed = false)

    await stopVMProcesses()

    return allTestsPassed
  }

}


/**
 * Call on the first project setup.
 * Activates all necessary google services.
 * @param {string} gitBranchName The deployed version of the code is taken from this branch
 */
async function setupProjectFirstTime(gitBranchName = 'master') {
  const prompt = INTERNAL.promisifiedReadlineInterface()

  log.green('Create a Google Cloud Platform Project through Google UI. Name it however you like.')
  log.green(
    'Generate an OAuth2 Client ID for it. The type should be "Web Application", the ' +
    'allowed javascript origins should be, in this order, "http://localhost:8080" ' +
    'and "https://web.<project-id>.appspot.com", where <project-id> stands for your project\'s ' +
    'id. Also, the redirect URIs must be only "http://localhost:8080".'
  )
  log.green(
    'Download the created credential as JSON and store it ' +
    'on the "src/credentials" directory inside the "google-interface" directory ' +
    '(absolute path ' + resolve(__dirname, '../google-interface/src/credentials') + ').'
  )
  log.green(
    'Name the file exactly "' + basename(process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']) +
    '", without the quotes, though.'
  )
  await prompt.question(
    'Press Enter when you are done... (when asked to authorize this app, ' +
    'use the same Google Account with which you created the Google Platform Project, since this is the) ' +
    '"admin" account.'
  )

  await authorizeProjectAsAdmin()

  const auth = await getOAuth2ClientFromLocalCredentials(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']
  )

  const projId = await getProjectId()
  const projNumber = await prompt.question('Paste your project\'s number here (not project ID or project name): ')

  log.green(
    'Using Github site (specifically, the https://github.com/settings/tokens page)' +
    ', create a Personal Access Token and give it two access scopes: "repo:status" and "gist". ' +
    'Take note of the generated token\'s number. ' +
    'Note: this must be done by the owner of the repo for the project on github.'
  )

  const githubTokenNumber = await prompt.question('Paste your Github access token number here: ')
  const githubRepo = await prompt.question(
    'Paste the Github repository name for the project (the repo you own). ' +
    'We want the short name, not the full url. For example, "athena-judge". Type the repo name here: '
  )
  const githubUsername = await prompt.question(
    'Type your github username here: '
  )

  await writeFile(process.env['GITHUB_ACCESS_TOKEN'], JSON.stringify({
    user: githubUsername,
    repo: githubRepo,
    token: githubTokenNumber
  }))

  log.green('\nEnabling Google APIs (this may take a couple of minutes)...')

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
        'cloudresourcemanager.googleapis.com',
        'appengine.googleapis.com',
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

  log.green('Enabled APIs\n')

  log.green('Creating Pub/Sub handling service account...')

  const pubsubAccountEmail = await INTERNAL.createServiceAccount(
    process.env['PUBSUB_LISTENER_SERVICEACCOUNT_DISPLAY_NAME'],
    process.env['PUBSUB_LISTENER_SERVICEACCOUNT_ID'],
    process.env['PUBSUB_LISTENER_SERVICEACCOUNT_CREDENTIALS']
  )

  log.green('Created Pub/Sub handling service account\n')

  log.green('Creating Cloud Storage handling service account...')

  const storageAccountEmail = await INTERNAL.createServiceAccount(
    process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_DISPLAY_NAME'],
    process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_ID'],
    process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_CREDENTIALS']
  )

  log.green('Created Cloud Storage handling service account\n')

  log.green('Creating VM instance connector service account...')

  const vmAccountEmail = await INTERNAL.createServiceAccount(
    process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_DISPLAY_NAME'],
    process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_ID'],
    process.env['VM_INSTANCE_CONNECTOR_SERVICEACCOUNT_CREDENTIALS']
  )

  log.green('Created VM instance connector service account\n')

  log.green('Creating AppEngine handler service account...')

  const appEngineAccountEmail = await INTERNAL.createServiceAccount(
    process.env['APPENGINE_HANDLER_SERVICEACCOUNT_DISPLAY_NAME'],
    process.env['APPENGINE_HANDLER_SERVICEACCOUNT_ID'],
    process.env['APPENGINE_HANDLER_SERVICEACCOUNT_CREDENTIALS']
  )

  log.green('Created AppEngine handler service account\n')

  log.green('Creating Pub/Sub topic and subscription...')

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

  log.green('Created Pub/Sub topic and subscription\n')

  log.green('Creating Cloud Storage bucket...')

  const storage = google.storage({
    version: 'v1',
    auth
  })

  await storage.buckets.insert({
    project: projId,
    requestBody: {
      name: await getCloudstorageBucketName()
    }
  })

  log.green('Created Cloud Storage bucket\n')

  log.green('Defining Pub/Sub, Cloud Storage, Compute Engine and App Engine service accounts\' permissions...')

  const resourceManager = google.cloudresourcemanager({
    version: 'v1',
    auth
  })

  const { data: projPolicies } = await resourceManager.projects.getIamPolicy({
    resource: projId,
    requestBody: {}
  })

  INTERNAL.addMemberToProjectRole_inplace(
    projPolicies,
    'serviceAccount:classroom-notifications@system.gserviceaccount.com',
    'roles/pubsub.publisher'
  )

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + pubsubAccountEmail, 'roles/pubsub.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + storageAccountEmail, 'roles/storage.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccountEmail, 'roles/compute.osAdminLogin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccountEmail, 'roles/compute.admin')

  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + vmAccountEmail, 'roles/iam.serviceAccountUser')

  /**
   * Owner !!! This is necessary for the service account
   * to have permission to create the App Engine application
   * (though deploying does not require the 'owner' role)
   */
  INTERNAL.addMemberToProjectRole_inplace(projPolicies, 'serviceAccount:' + appEngineAccountEmail, 'roles/owner')

  await resourceManager.projects.setIamPolicy({
    resource: projId,
    requestBody: {
      policy: projPolicies
    }
  })

  log.green('Defined service accounts\' permissions\n')

  log.green(
    'Now two members of the team must have teacher/student roles at the Google Classroom ' +
    'test course (one must be a teacher; the other, a student). Once these roles are established, ' +
    'we will authorize the app with these accounts:'
  )

  await authorizeTestCourseAsTeacher()

  await authorizeTestCourseAsStudent()

  await createAndSetupVM(gitBranchName)

  log.green('Installing gcloud command line tools...')

  await INTERNAL.downloadUncompressInstallGCloud()

  log.green('Installed gcloud\n')

  log.green('Creating App Engine application for the project...')

  await INTERNAL.runPiped('gcloud', ['app', 'create', '-q', '--region', 'us-central'], true, false)

  log.green('Create App Engine application')

  await deployContinuousIntegrationServer()

  prompt.close()

}

/**
 * Creates a Compute Engine Instance and deploys code to it (from the project github repo).
 * @param {string} gitBranchName The branch from which to take the code that will be deployed to the VM
 */
async function createAndSetupVM(gitBranchName = 'master') {

  log.green('Creating compute engine instance and setting up (this may take a couple of minutes)...')

  const scopes = ['https://www.googleapis.com/auth/cloud-platform']
  const oauthCredPath = process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE']
  const oauthTokenPath = process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']
  const projId = await getProjectId()

  const auth = await INTERNAL.getOAuth2ClientInteractive(
    oauthCredPath,
    scopes,
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
          return reject(new Error('Failed to create VM instance'))
        }
        return resolve()
      }, 5000)
    })
  }

  log.green('Created Compute Engine VM instance\n')

  log.green('Deploying code to VM instance...')

  await runCommandOnVM(
    'sudo apt-get update;' +
    'sudo apt-get install git-core -y;' +
    'git clone ' + (await getGithubRepoHref()) + ' athena-latest;' +
    'cd athena-latest;' +
    'git checkout ' + gitBranchName + ' ;'
  )

  log.green('Code deployed to VM instance\n')

  log.green('Uploading local credentials to VM...')

  await uploadCredentials('athena-latest/google-interface/src/credentials')

  log.green('Uploaded local credentials to VM\n')

  log.green('Running setup in VM instance...')

  await runCommandOnVM(
    'cd athena-latest;' +
    'bash setup.sh;'
  )

  log.green('Setup has been succesfully run in VM\n')

}

/**
 * Example: cmdString="ls /" will list all content of the root directory of the remote VM instance.
 * By default, the working directory will be the home dir of the remote user
 * 
 * @returns {Promise<string>} stdout of the command
 */
async function runCommandOnVM(cmdString, hideConsoleLogs = false, timeout = undefined) {

  const { sshKeys, vmUsername, instanceIP } = await INTERNAL.setupInstanceConnection()

  return await INTERNAL.runCommandOverSSH(
    cmdString,
    sshKeys.privateKeyPath,
    vmUsername,
    instanceIP,
    hideConsoleLogs,
    timeout
  )

  // oslogin.users.sshPublicKeys.delete({
  //   name: 'users/' + vmAccountEmail + '/sshPublicKeys/' + vmLoginProfile.loginProfile.sshPublicKeys[0].fingerprint
  // })

}

/**
 * Stops listener and runner
 * 
 * TODO: After implementing App Engine, stop it as well
 * 
 * TODO: Create a common .env so as to avoid hard-coding port numbers
 */
async function stopVMProcesses() {
  await runCommandOnVM(
    'echo "exit" > /dev/tcp/localhost/3000 ;' + // stop listener, which will tell runner to stop as well
    'sleep 10;' + // wait 10 seconds for processes to stop
    'if [[ $(sudo fuser 3000/tcp) != "" ]]; then sudo fuser -k 3000/tcp ; fi;' +
    'if [[ $(sudo fuser 3001/tcp) != "" ]]; then sudo fuser -k 3001/tcp ; fi;' +
    '( docker stop $(docker ps -q) 1>/dev/null 2>&1 || exit 0 );' +
    'sudo fuser -k 8085/tcp;' // stop web-backend, if was running
  ).catch(() => { })
}



/**
 * - stop running VM processes
 * - git clone to another temporary dir
 * - deploy credentials to it
 * - run tests
 * - if ok and deploy=true, rename the directory to make it official (athena-latest) and delete the old one. Run the new code
 * - else, just delete the temp dir. Rerun the original code. Report back the error, if any
 * 
 * @param {string} branchNameOrCommitId A branch name or a commit ID for running 'git checkout' to fetch code
 * @param {boolean} deploy Whether to really deploy after making tests. If false, the deployment to production 
 * is not done and, instead, the code is reversed to the last stable version
 * @param {number} timeout Maximum milliseconds that any one remote command session may take
 * 
 * @returns {Promise<boolean>} true iff tests passed
 */
async function deployToVM(branchNameOrCommitId = 'master', deploy = true, timeout = undefined) {

  if (! await INTERNAL.acquireVMLock()) {
    log.green('The VM is in use by another process, you should try again later')
    return false
  }

  log.green('Stopping application processes previously in execution (if any)')
  await stopVMProcesses()
  log.green('Application processes stopped')

  let allOK = false

  try {
    await runCommandOnVM(
      // remove old tmp dir, if present
      '(rm -r athena-tmp-deploy || exit 0) ;' +
      // fetch newest code
      'git clone ' + (await getGithubRepoHref()) + ' athena-tmp-deploy ;' +
      'cd athena-tmp-deploy ;' +
      'git checkout ' + branchNameOrCommitId + ' ;' +
      // install npm dependencies
      'cd google-interface/ ;' +
      'npm install ;' +
      'cd ../backend ;' +
      'npm install ;' +
      'cd ../frontend ;' +
      'npm install ;' +
      'cd ../runner ;' +
      'npm install ;' +
      'cd ../listener ;' +
      'npm install ;' +
      // copy credentials
      'cd ../ ;' +
      'cp ../athena-latest/google-interface/src/credentials/*.json ./google-interface/src/credentials/ ;' +
      // build docker container (it will overwrite the production container-image, so we should reset it later)
      // the container is built only AFTER having uploaded credentials, because it needs them
      // TODO: The container should not have secrets !!!! This exposes them to code being run inside !!!
      'cd runner/docker ;' +
      'npm run build ;',
      undefined,
      timeout
    )

    const testsPassed = await INTERNAL.runTestsOnVM('athena-tmp-deploy', timeout)

    allOK = testsPassed

  } catch (err) {
    allOK = false
  }


  if (!allOK || !deploy) {
    // rebuild docker image; rerun production application processes
    await runCommandOnVM(
      '(rm -r athena-tmp-deploy || exit 0);' +
      'cd athena-latest/runner/docker && npm run build ;' +
      'cd ../../ ;' +
      'cd listener/ && screen -Logfile /usr/local/lib/athena-judge/listener.log -dmL /bin/bash -c "npm run prod | ts" ;' +
      'cd ../runner && screen -Logfile /usr/local/lib/athena-judge/runner.log -dmL /bin/bash -c "npm run prod | ts" ;',
      undefined,
      timeout
    )

    if (!allOK) {
      log.red('Deploying failed. The application was restarted with the previous stable codebase')
    } else {
      log.green('All tests passed ! However, deploy was called with deploy=false, hence the production ' +
        'code has been resumed to the last stable version instead of deploying the new version')
    }
  } else {
    // make athena-tmp-deploy directory the production one
    await runCommandOnVM(
      'rm -r athena-latest ;' +
      'mv athena-tmp-deploy athena-latest ;' +
      'cd athena-latest ;' +
      'cd listener/ && screen -Logfile /usr/local/lib/athena-judge/listener.log -dmL /bin/bash -c "npm run prod | ts" ;' +
      'cd ../runner && screen -Logfile /usr/local/lib/athena-judge/runner.log -dmL /bin/bash -c "npm run prod | ts" ;',
      undefined,
      timeout
    )
    log.green('Deploying succeded ! The application was started with the new codebase')
  }

  await INTERNAL.releaseVMLock()

  return allOK

}

async function listTmpDriveFilesThatShouldBeDeleted() {

  const teacherAuth = await getOAuth2ClientFromCloudStorage(process.env['CLASSROOM_TEST_COURSE_ID'])
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

  log.green(driveFiles)

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

/**
 * Creates Pub/Sub Registration for Classroom test course
 */
async function createTestCourseRegistration() {
  await createRegistration(process.env['CLASSROOM_TEST_COURSE_ID'])
}

/**
 * Deploys code from 'ci-webserver' folder to Google, employing the deploy script from the
 * package itself
 */
async function deployContinuousIntegrationServer() {

  if (! await INTERNAL.acquireVMLock()) {
    return log.green('The VM is in use by another process, you should try again later')
  }

  await INTERNAL.assertGCloudConfig()

  log.green('Deploying Continuous Integration code to App Engine...')

  await INTERNAL.runPiped('npm', ['run', 'deploy'], true, false, resolve(__dirname, '../../ci-webserver'))

  await INTERNAL.releaseVMLock()

  log.green('Deployed CI server to App Engine\n')

}

/**
 * Only tests. Does NOT acquire the lock 
 *
 * @returns {Promise<boolean>} true if, and only if, the VM *IS* currently locked
 */
async function testVMLock() {
  try {
    await runCommandOnVM('[ -d /tmp/athena-judge-lockdir ] || exit 1', true)
  } catch (err) {
    log.green('Test: VM is not locked')
    return false
  }

  log.green('Test: VM is locked')
  return true
}

async function authorizeTestCourseAsTeacher() {
  log.green(
    'Authorizing Classroom test course as teacher (' +
    'use a Google Account registered as teacher in the test course)...'
  )

  const credPath = '/tmp/athena-judge-teacher-creds-' + new Date().valueOf() + '.json'
  await INTERNAL.getOAuth2ClientInteractive(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    SCOPES,
    credPath
  )
  await uploadTeacherCredential(process.env['CLASSROOM_TEST_COURSE_ID'], credPath)

  log.green('Authorized Classroom test course as teacher (credential uploaded to Cloud Storage)\n')
}

async function authorizeTestCourseAsStudent() {

  log.green(
    'Authorizing Classroom test course as student (' +
    'use a Google Account registered as student in the test course)...'
  )

  await INTERNAL.getOAuth2ClientInteractive(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    SCOPES,
    process.env['CLASSROOM_TEST_COURSE_STUDENT_OAUTH_TOKEN_FILE']
  )

  log.green('Authorized Classroom test course as student (credential saved locally)\n')
}

async function authorizeProjectAsAdmin() {

  log.green(
    'Authorizing project as admin (use the same Google Account with which ' +
    'the Google Platform Project was created)...'
  )

  await INTERNAL.getOAuth2ClientInteractive(
    process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
    ['https://www.googleapis.com/auth/cloud-platform'],
    process.env['OAUTH_PROJECT_ADMIN_TOKEN_FILE']
  )

  log.green('Authorized project as admin (credential saved locally)\n')

}

// @ts-ignore
if (require.main === module) {
  const catchall = err => {
    log.red('Error during run of the command (may be an Athena bug, may not be...):')
    log.red(err)
  }

  const program = require('commander')

  program
    .command('instance-ip')
    .description('Print the IP of the google virtual machine instance used by Athena')
    .action(() => getVMIpAddress().then(IP => log.green(IP)).catch(catchall))

  program
    .command('setup-first-time [gitBranchNameOrCommitId]')
    .description('Run project setup. See README for guidance')
    .action(gitBranchNameOrCommitId => {
      log.green('Running project setup based on git commit/branch', gitBranchNameOrCommitId)
      setupProjectFirstTime(gitBranchNameOrCommitId)
        .then(() => log.green('\nProject setup complete. Exiting...'))
        .catch(catchall)
    })


  program
    .command('deploy [gitBranchNameOrCommitId]')
    .description(
      'Deploy code from a git branch/commit to production. If not specified,' +
      'the default branch `master` will be used. ' +
      'Concretely, this executes a "git clone" on Athena\'s virtual machine and runs both ' +
      '`listener` and `runner` components there. ' +
      'Before deploying the new version of them, though, a full test suite is ' +
      'run, which blocks the deploy if it fails.'
    )
    .option('-o, --test-only', 'Avoids deploying the code to production. Only tests it')
    .option(
      '-t, --timeout [timeoutInMilliseconds]',
      'Enforces a timeout for each individual test-run in ' +
      'the virtual machine',
      parseInt
    )
    .action((gitBranchNameOrCommitId, options) => {
      gitBranchNameOrCommitId = gitBranchNameOrCommitId || 'master'
      if (isNaN(options.timeout)) options.timeout = undefined

      log.green(
        'Deploying to VM from git branch/commit',
        gitBranchNameOrCommitId,
        options.timeout ? ('with timeout ' + options.timeout) : 'without timeout',
        'and ' + (options.testOnly ? 'in' : 'NOT in') + ' test-only mode'
      )
      deployToVM(gitBranchNameOrCommitId, !options.testOnly, options.timeout)
        .then(passed => {
          if (passed) return
          throw new Error()
        })
        .catch(() => process.exit(1))
    })

  program
    .command('upload-credentials')
    .description('Uploads local credential files (.json) to virtual machine instance only')
    .action(() =>
      uploadCredentials('athena-latest/google-interface/src/credentials')
        .then(() => log.green('Done. Exiting...'))
        .catch(catchall)
    )

  program
    .command('update-ciwebserver')
    .description(
      'Deploys a new version of the continuous integration server. Its new code ' +
      'is taken from the LOCAL workspace (not any git branch/commit)'
    )
    .action(() => deployContinuousIntegrationServer().then(() => log.green('Done. Exiting...')).catch(catchall))

  program
    .command('authorize-testcourse-as-teacher')
    .description(
      'Grants credentials to Athena, from a Google Account (should be a teacher ' +
      'at the test course)'
    )
    .action(() => authorizeTestCourseAsTeacher().then(() => log.green('Done. Exiting...')).catch(catchall))

  program
    .command('authorize-testcourse-as-student')
    .description(
      'Grants credentials to Athena, from a Google Account (should be a student ' +
      'at the test course)'
    )
    .action(() => authorizeTestCourseAsStudent().then(() => log.green('Done. Exiting...')).catch(catchall))

  program
    .command('authorize-project-as-admin')
    .description(
      'Grants credentials to Athena, so that it can access Google Cloud Platform resources (' +
      'Compute Engine, App Engine, Pub/Sub, Cloud Storage,...). The user account used to give the credentials ' +
      'must be an owner (admin) of the Google Platform Project'
    )
    .action(() => authorizeProjectAsAdmin().then(() => log.green('Done. Exiting...')).catch(catchall))

  program
    .command('download-gcloud')
    .description(
      'Downloads gcloud command line tool and installs it ' +
      'inside a folder at the project\'s top level directory'
    )
    .action(() =>
      INTERNAL.downloadUncompressInstallGCloud()
        .then(() => log.green('Done. Exiting...'))
        .catch(catchall)
    )

  program
    .command('acquire-vm-lock')
    .description(
      'Acquires the lockdir created on the VM (' +
      'this acquisition is automatically done by Athena\'s ' +
      'processes that need it). However, if you want to ' +
      'acquire it yourself, then so be it...'
    )
    .action(() => INTERNAL.acquireVMLock().catch(catchall))

  program
    .command('release-vm-lock')
    .description(
      'Releases the lockdir created on the VM (' +
      'which is used by processes to avoid using the same ' +
      'resource simultaneously, but has led to deadlock ' +
      'all too frequently...)'
    )
    .action(() => INTERNAL.releaseVMLock().catch(catchall))


  program.parse(process.argv)

}


module.exports = {
  setupProjectFirstTime,
  uploadCredentials,
  deployToVM,
  deployContinuousIntegrationServer,
  testVMLock,
  releaseVMLock: INTERNAL.releaseVMLock,
  stopVMProcesses
}
