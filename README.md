# Athena Judge
[![DeepScan grade](https://deepscan.io/api/projects/2668/branches/18208/badge/grade.svg)](https://deepscan.io/dashboard#view=project&pid=2668&bid=18208)
## Setup

1. Run "./setup.sh". DO NOT run with sudo.

## Running in development

1. Open three command prompts.
2. In the first command prompt, run "cd backend" then "npm run dev".
3. In the second command promp, run "cd runner" then "npm run dev".
4. In the third command promp, run "cd frontend" then "npm run dev".
5. A browser window should pop up with everything working.

Using this setup, your server will restart whenever you make a change in the backend and your browser will refresh whenever you make a change in the frontend.

Note that the database is restarted everytime the server starts.

## About Google credentials

### Types

There are 3 types of credentials:
1.  OAuthClient credentials: Belong to the project in GCP. Identifies the application to Google.
2.  OAuth end-user credentials: An acess token granted to the application when an end-user grants the former access to his/her account.
3.  Service account credentials: Belong to a service account created within GCP. Service accounts are used for some APIs which do not take actions of behalf of end-users. Example: Listening to Pub/Sub notifications.

### Where are they needed

Types 1 and 2 are required to take actions on behalf of end-users (like accessing their submissions on Classroom courses); type 3 is required on some APIs which use a service account (a special type of Google Account created inside a Google Platform Project).

### How are they managed in the project

Refer to the project structure

## Project structure

note: `/` means the directory of this README file.


### `/pubsub`


File or Directory | Purpose | How to use
--- | --- | ---
`credentials/` | Contains credentials (all 3 types) | You don't ! Scripts access them own their own. Except if you do not have type 1 or type 3, in which case you should grab them from Google Cloud Project.
`.env` | Configures file-path for credentials used in the project | When you download type 1 or type 3 credentials from the Google Cloud Project, you should name them according to what is described here
`auth.js` | Authenticate the application for accessing google API on behalf of an end-user | Since it exports `Authenticate()` function, you do as the [example](https://gist.github.com/megatron0000/1159efbb5f658f1302a802b382f3f7f5). If there is not a end-user credential stored in `/pubsub/credentials/oauth-client-credentials.json`, calling the function will trigger a terminal-based "permission-granting" process.
`config.js` | Loads environment variables (described in `.env` file) and declares access scopes required for accessing Google API | You don't ! This is accessed by other scripts (like `auth.js`) which need credentials.
`listen-for-messages.js` | When executed, listens for Pub/Sub notifications on a hardcoded Subscription | Just invoke it and wait. It listens for notifications and logs them to stdout when any arrives.
`samples.js` | Collection of Google API example usages | Read the code if you will
`index.js` | Does nothing | Does nothing

