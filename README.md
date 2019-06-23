- [Overall usage (end user's point of view)](#Overall-usage-end-users-point-of-view)
- [Overall architecture](#Overall-architecture)
- [Google resources](#Google-resources)
- [Google API Authentication](#Google-API-Authentication)
- [Project setup **exclusive to 1 developer (project admin)**](#Project-setup-exclusive-to-1-developer-project-admin)
  - [Basic runtime dependencies](#Basic-runtime-dependencies)
  - [Github fork and access token](#Github-fork-and-access-token)
  - [Manual Google Platform Project creation](#Manual-Google-Platform-Project-creation)
  - [Google Platform Project configuration](#Google-Platform-Project-configuration)
- [Github Webhook creation](#Github-Webhook-creation)
- [Project setup for all other developers (**except the admin**)](#Project-setup-for-all-other-developers-except-the-admin)
- [Overall usage (developer's point of view)](#Overall-usage-developers-point-of-view)
  - [Components](#Components)
    - [`manage`](#manage)
    - [`google-interface`](#google-interface)
    - [`backend`](#backend)
    - [`frontend`](#frontend)
    - [`runner`](#runner)
    - [`listener`](#listener)
    - [`ci-webserver`](#ci-webserver)
  - [Develop and test](#Develop-and-test)
    - [Testing](#Testing)
    - [Lock mechanism (actually, a bad limitation)](#Lock-mechanism-actually-a-bad-limitation)
    - [Production code](#Production-code)
    - [Debugging](#Debugging)

# Overall usage (end user's point of view)

Athena's design is intended to minimize direct user interaction with it.

The students DO NOT interact with the system at all. They use Google Classroom's interface to submit their assignment (in some compressed format - zip, gzip) and receive the test results by email. Their grade is assigned directly on Classroom by the Athena system.

The teacher, on the other hand, must access Athena directly because Google Classroom's interface has no option to "submit test files". In other words, the teacher cannot manage input-output files using Google's interface.

Athena's working logic for the teacher is:

1. The teacher uses Google Classroom's interface (not Athena) to normally create a course.
2. The teacher uses Google Classroom's interface (not Athena) to create an assignment (also equivalently called "coursework") inside the course. The assignment is an activity which students must submit their code solution to.
3. The teacher accesses Athena's web server (defined by packages `frontend` and `backend`), which will list the courses he had created on Google Classroom, along with their respective assignments.
4. Still using Athena's web server, the teacher selects the desired course and grants his/her *permission* to Athena. This permission allows Athena to act on his/her behalf through Google's API (necessary for accessing materials posted by students, sending emails and assigning grades).
5. Still using Athena's web server, the teacher selects one of his/her assignments and submits test files for it. A test is a pair *input*-*output* (the contents of *input* file are sent to *stdin* of the student's program and the *output* file is compared with the *stdout* generated by the student), along some metadata like `test weight` (to compose the student's grade in association with other tests) and if the test is `private` or not (for a private test, the student will not have access to its content. The opposite holds for public tests).

The teacher has to do nothing else. Once a student submits a code solution on Google Classroom, Athena will detect this submission, fetch the test-files for the associated assignment and run the tests against the program submitted by the student. Having done this, Athena will grade the student's work (which means it will update Google Classroom with the grade, since there is a way to do it using Classroom's REST API) and send an email to the student, describing which tests passed/fail and, for public tests, containing a comparison between the expected output and the output generated by the student's program (or errors, if any).

# Overall architecture

The following describes the top-level directories which comprise Athena. All code is written in `javascript`.

- `backend` and `frontend`: Collectively, they implement a web server for the teacher to access and submit his/her test files. The frontend is written with `React`, and the backend, with `express` npm module.
- `listener`: Implements a process (not a web server) that idles most of the time, except when it detects that a student posted a solution to an assignment at Google Classroom. In such a case, the process fetches the files submitted by the student and schedules the execution of the test-files (those that the teacher previously configured), later assigning the grade and sending the result email to the student. However, the execution of the code itself is not done by this module.
- `runner`: Implements a web server. It accepts requests for running code, runs it (in a Docker container), and responds with the results. This module is used by `listener` (which means `listener` sends HTTP requests to `runner` and awaits the result). The internal communication from `runner` to its containers (which no other module can see) is done via `websockets` (`socket.io` npm module).
- `google-interface`: Implements functions to interact with Google API, and is used by all other modules (therefore, you will find that other modules contain a `google-interface` symlink inside of them). The detail of which Google resources are involved is explained elsewhere.
- `ci-webserver`: Implements a web server for Continuous Integration purposes. This web server idles most of the time, except when it detects a `push` to Github (meaning that an Athena developer published one or more commits). In such a case, it runs all the configured unit-tests (and integration-tests), collects all log output generated during the tests, and outputs this result directly at Github (you will see that various commits on Github have either a checkmark or an 'X' beside them, with a link to view the test logs).
- `manage`: Implements scripts for managing the project. For complete usage information, run `node manage/src/index.js --help`. Among other things, these scripts can:
  - Deploy a git branch/commit to production.
  - Run all tests.
  - Update the CI (continuous integration) webserver with new code from the local workspace.
  - Setup (configure) the project and all necessary Google resources when developing from scratch (which means "when creating a new Google Platform Project").
- `google-cloud-sdk`: Although it does not exist on Github (it is excluded by .gitignore), this directory is created locally when running the setup scripts. It contains the `gcloud` command line tool (published by Google) which helps to interact with some of the necessary resources. If you wish, `gcloud` can be reinstalled at any time by using the `manage/src/index.js` script.

# Google resources

- Cloud Platform Project: This is the main piece for interacting with Google. One first creates a Project, then download a "credentials" JSON file (which identifies Athena to Google) and only then can one interact with Google API in any way.
- Cloud Storage: Works like a file system (only that it is remote). It is used to store submission files from students, test files from teachers, as well as credentials granted to Athena by the teachers (Athena can only assign grades to students on behalf of the teacher because of these credentials).
- Compute Engine: Is a service to create and manage virtual machine instances. Athena's `listener` and `runner` currently reside in one virtual machine.
- App Engine: Is a service to create (and deploy new versions of) web servers easily. `ci-webserver` uses it. Although `backend` is currently only served locally, it should be placed on App Engine in the future.
- Cloud Pub/Sub: Works like a message queue. Someone publishes to a `Topic` and listeners receive the message on a `Subscription` (terms used by the Google API). The Athena `listener` module uses this service for detecting when a student submits his/her work at an assignment. In this case, Google Classroom itself is the publisher, and the `listener` process is the receiver of the message.
- Service Account: Works like a Google Account, only that it is a "bot" (meaning it does not belong to an end user, although it has an email). Athena uses a separate service account for handling Cloud Storage, another for Cloud Pub/Sub, a third one for App Engine, etc. (you get the idea). See the section on Google API authentication for details.

Concretely, Athena currently uses:
- 1 virtual machine (houses `listener` and `runner`)
- 1 App Engine application (houses `ci-webserver`)
- 1 Cloud Pub/Sub Topic
- 1 Cloud Pub/Sub Subscription
- 1 Cloud Storage Bucket (actually, more than one, but the others are created automatically by Google - for managing internal storage needs of App Engine - and never directly referenced by Athena)

# Google API Authentication

Athena, as a Google Platform Project, possesses a pair `OAuth client ID - OAuth client secret` (henceforth called `project credentials`), which serves to uniquely identify the Project when interacting with Google. These credentials are manually created on Google Cloud Platform Console (web interface) and downloaded (see `.env` file).

Another type of credential is a `user token`, another JSON (containing at least the fields `access_token` and `refresh_token`) which symbolizes that a user allowed certain permissions to Athena (concretely, to Athena's `project credentials`). Of this kind is the permission which a teacher grants to Athena (so the system can grade students on behalf of the teacher).

Finally, for APIs that deal exclusively with Cloud resources, not end user's data, a `service account key` can be used (this is the case when Athena accesses Cloud Storage, Cloud Pub/Sub, Compute Engine, etc.)

In synthesis, when Athena accesses Google API, it provides 1 out of 2 credentials to Google:
- If the API deals with end user data, Athena provides its `project credentials` alongside the affected user's `user token`.
- If the API does *not* deal with a particular user and his/her data, but only with the Cloud resources owned by the Athena Google Platform Project, Athena provides a `service account key`


# Project setup **exclusive to 1 developer (project admin)**

Only 1 developer should follow the next instructions in this section. This developer will become the administrator of both the Github repository and the Google Cloud Platform Project.

## Basic runtime dependencies

The `setup.sh` is meant primarily for setting up the Compute Engine virtual machine used by Athena, but also serves well for setting up the developer's local workspace. The script supposes an Ubuntu linux operating system. To execute it, run `bash setup.sh` without using `sudo` (the script will, when needed).

If you already have some of the dependencies the script installs, you can - instead of executing the script - manually inspect (read) it to understand which packages are installed and then install each one manually by yourself.

Noteworthy: nodejs version 8.11.2 is used. If you use another version, do not be surprised if building the `grpc` npm modules does not work (maybe it does..., and no guarantee that this will be the only issue).

## Github fork and access token

Since the `ci-webserver` makes modifications to the Github repository, the original repository must be forked by 1 developer, who will grant some permissions to Athena so it can modify the forked repo when needed (namely, when it needs to notify whether a test run passed or failed). 

The credential which must be available to Athena is a `Github access token`. It must be generated by the developer who owns the fork of Athena's repository.

For this, using Github site, go to `Settings > Developer Settings > Personal access tokens > Generate new token`. A screen will appear to select the `scopes` granted to the token. Among these, select `repo:status` and `gist`. Click the create button.

Once created, the token itself will appear (along with a warning message alerting that "you won't be able to see it again"). Take note of this number (which is the `access token`).

Later, when running the step for google platform project configuration (explained in another section) you will be prompted to paste this token in the console (see the mentioned section for details).


## Manual Google Platform Project creation

A Project must be created with Google (and only 1 project). For this, one of the developers must create it (who will become the "admin"). Once created, the dashboard of the Project will look like this (except that there will be no App Engine or Compute Engine data at first):

![](https://i.postimg.cc/QMvN0v0s/image.png)

Notice that the project has a `name`, an `id` and a `number` as its identifiers. Also observe that it must be associated with a "billing account" (someone will have to spend the one-year "free trial" offered).

Once created, go to `APIs & Services > Credentials > OAuth consent screen`. Here add an entry to `Authorized domains`. Namely, this entry must be of the form "{project-id}.appspot.com", where {project-id} must be substituted for your project's id. For the example project, this turned out to be as follows:

![](https://i.postimg.cc/P546j87F/image.png)

Then go to `APIs & Services > Credentials > Credentials > Create Credentials > OAuth Client ID`. A window will open to choose the type of the credential, and `Web Application` must be selected. Once this is done, more fields will appear. Among these, `Name` is irrelevant, but `Authorized JavaScript origins` and `Authorized redirect URIs` must be as follows:
- To `Authorized JavaScript origins`, add (in this same order) first "http://localhost:8080", then "https://web.{project-id}.appspot.com", where {project-id} must be substituted for your project's id
- To `Authorized redirect URIs`, add only "http://localhost:8080".

For the example project, this turned out to be:

![](https://i.postimg.cc/hGQ70kVb/image.png)

Hit the create button. Once created it will be listed as such. On the list, it can be downloaded by clicking the "download as JSON" button. Do not do this yet (though no harm done if you did).

## Google Platform Project configuration

After having created the project as explained, run `node manage/src/index.js setup-first-time` and follow the instructions which will appear on the console.

Namely, the first steps instruct to create a project (as already explained) and to download the credentials with a certain name to a certain local directory (the script tells the exact naming and location).

Further up, resources are created (Cloud Pub/Sub topic and subscription, Service Accounts, among others).

There is a step for "authorizing the Classroom test course". This exists because Google has no testing facilities related to Google Classroom, so the project depends on a teacher (email ending in @gp.ita.br) having created a Classroom course to be used for testing during development. Currently, a course already exists and does not need to be changed (in fact, it should not be changed, else the corresponding `CLASSROOM_TEST_COURSE_ID` entry in `.env` file must be updated to match). Therefore, the teacher (Inaldo Capistrano) who created the test course must elect one of the developers as teacher in the course and another as student, **before** the authorization procedure is followed on the `manage/src/index.js` script.

Also, you will be prompted to type (or paste, for that matter) the Github access token, the name of the repository fork and your github username.

# Github Webhook creation

A Webhook is the mechanism by which Github will notify Athena's `ci-webserver` when commits are pushed to the repo.

To create one, access your fork of Athena on Github and go to `Settings > Webhooks > Add webhook`. A configuration screen will appear, where the `Payload URL` must be filled so as to point to the address where Athena's `ci-webserver` is located on the internet (hosted by App Engine). The value of this field must be "https://{project-id}.appspot.com/github-push", where {project-id} must be substituted by the real id of your Google Cloud Platform Project. In the case of the example Project, the configuration was as follows:


![](https://i.postimg.cc/zXQn0dJC/image.png)

# Project setup for all other developers (**except the admin**)

Once the developer chosen as admin has executed all necessary setup steps (see the respective section for details), he/she should collect all `.json` files from the `google-interface/src/credentials/` directory. These files are the created credentials, and have to be manually copied to all other developer's `google-interface/src/credentials/` local directory.

Besides this copying procedure, all other developers must run `bash setup.sh` (the same as the project admin had to do - see the respective section for details).

Finally, the other developers must run `node manage/src/index.js download-gcloud`, which will download a local installation of the `gcloud` command line tools published by Google (which Athena uses, for example, to deploy App Engine webservers).

Nothing more should be needed (for example, but not exclusively: not another fork  of the Athena Github repository; no creation of another Cloud Platform Project; no creation of another Github access token, ...)

# Overall usage (developer's point of view)

The following describes how to run each Athena component (by component, understand "top-level directory") and how to develop and test.

## Components

### `manage`

Since it is primarily a command line script (except for the fact that it also exports functions), it is simply executed: `node manage/src/index.js --help` for general usage information or `node manage/src/index.js [cmd] --help` for help on a specific command.

Currently, the script's `deploy` command sets up both `listener` and `runner` to be executed on a Google Compute Engine virtual machine.

### `google-interface`

This component is not meant to be "run". It contains node modules which expose functions for interacting with Google resources, thus the intended usage is by `require`ing from other components.

### `backend`

How to run it is clearly defined in its `package.json`. Although you can see there the existence of `prod` and `dev` modes, currently there is no effective difference between the two.

It runs a webserver on port 8085.

### `frontend`

How to run it is clearly defined in its `package.json`. `npm run dev` is advised for local testing (it will spin up a webserver and open the browser window on the right address)

The `dev` mode runs a webserver (for serving static files, basically) on port 8080.

### `runner`

How to run it is clearly defined in its `package.json`. Currently it uses babel for converting its ES6-style import/export to CommonJS format, because nodejs v8.11.2 is used (at that version, node had no support for ES6).

Note that listener has a `docker` subdirectory, which specifies the code to be run **inside** the Docker container created by the `listener` process when it is asked to test a student's code submission. If source-code inside `docker` directory is changed, it will only take effect on local tests after the `build` command specified in `docker/package.json` is executed, so as to build a new Docker Image containing the new version of the code (on remote tests - namely those initiated by a push to Github or by running `deploy` command from Athena's `manage` component - no local build is necessary, since it will be automatically done as a precondition for running the tests).

`runner` runs a webserver at port 3001. When it receives a request for running a suite of tests, it spins up Docker containers which themselves listen on ports 3002 and up. In production, this happens when `listener` is notified of a student submission by Google Classroom, in which case `listener` sends an HTTP request to `runner` (read the code for the details).

### `listener`

How to run it is clearly defined in its `package.json`.

It runs a process (not a webserver) which awaits for notifications ("student submitted" notification) coming from Google Classroom (through Cloud Pub/Sub) and, when one does come, triggers the logic for running the test-files provided by the teacher against the code submitted by the student.

**limitation**: Currently, the Cloud Pub/Sub `Topic` and `Subscription` are only 1 of each. This means that, if the remote Athena virtual machine is running the `listener` process and you run a local `listener`, they will compete for notifications coming from Pub/Sub, which can lead to unexpected results. This should be fixed by creating more than 1 `Topic` and `Subscription`, so as not to share the same resources between different executions of the `listener` process.

Also note that `listener` (although not intended as webserver) listens on port 3000 as a way of being stopped: if it receives a TCP payload containing the text `exit`, the process terminates, after emitting a request to a `listener` process running on the same machine asking it to exit as well.

### `ci-webserver`

How to run it is clearly defined in its `package.json`. 

The `start` command runs the webserver locally on port 8080, but this will hardly be useful, since the local server will not receive a notification when a commit is pushed to Github (only the production `ci-webserver` will, since a Github Webhook was created for it as explained elsewhere).

The `deploy` command takes the source-code from the local `ci-webserver` directory as-it-is and uploads it to App Engine, effectively deploying the server to production.

**limitation**: Currently, no more than one instance of the server should trigger commit-tests because, if multiple instances do, they will compete for the same Athena virtual machine (on Google Compute Engine), leading to unpredictable results.

## Develop and test

### Testing

Generally, each component has a `test` subdirectory, where test files (`.js`) are located. They are run by `mocha` testing library by running `npm test` inside each component's directory (as you can read in their `package.json` `test` command).

Due to current limitations (such as using only 1 Cloud Pub/Sub `Topic`/`Subscription` and 1 Compute Engine virtual machine instance), components which make use of shared resources may exhibit erratic behaviour if run both locally and remotely (on Athena's virtual machine instance). Note that, by default, the project setup procedure **does** initiate the `listener` and `runner` processes remotely.

That being so, the "safe" way to test is to push your commit to Github. This way, the deployed version of `ci-webserver` will be notified of the commit and will run the tests for that commit on the virtual machine instance (stopping all previously running processes first, so as to avoid the exact problem mentioned in the last paragraph).

Another equivalent way of testing is by running the `deploy` command from `manage` component, with the flag `--test-only`. This will also stop running processes on the remote VM before running the tests there.

At all cases, the logs generated by testing Athena's components on the VM are collected and located at `/usr/local/lib/athena-judge` directory inside the VM.

### Lock mechanism (actually, a bad limitation)

If two developers try to run `deploy` simultaneously, one of them will receive an error back. This is achieved by a `lockdir` mechanism on the remote VM, through which a directory is created there everytime a test is to be run, and deleted when the tests are complete.

If this lockdir mechanism produces a deadlock (because some bug happened or whatever) you can acquire or release the lock manually using the `manage` component's command line script. This may interfere with `deploy` commands currently in execution or with the `ci-webserver`, since it too acquires the lock before running tests.

### Production code

The project setup procedures create a directory named `athena-latest` on Athena's virtual machine, taken to be a clone of the `master` branch of the Github repo as it was when the setup procedures were executed. These procedures also run `listener` and `runner` components inside the VM. 

Once you decide to ship a new version of the production code, call the `deploy` command from `manage`'s command line script. At all cases, the production processes are run with timestamped log files, located at `/usr/local/lib/athena-judge` on the VM.

### Debugging

In general, when a commit-test fails, `ci-webserver` outputs test logs at Github (an icon beside the commit with a URL to see the output log).

However, this log is not complete. It only lists output generated by the `mocha` scripts (this is mostly a right description, but not exactly), which do not include the `stdout` of Athena's webservers (which run in the "background", after all). To see these further logs, refer to `/usr/local/lib/athena-judge` directory inside the VM, which hosts log files for Athena's components executed inside the VM.

If you change the implementation of `ci-webserver` itself and deploy the new version using `update-ciwebserver` command from Athena's `manage` component, you may want to debug the `ci-webserver` itself. This can be done by running `gcloud app logs tail` to see the `stdout` generated by the server running on App Engine (the environment to which it was deployed).

Finally, you can interact with any Google resource through the web interface (Google Cloud Platform Console). This way, it is possible to "enter" the VM instance (SSH), the `ci-webserver` instance (running on App Engine) as well as see App Engine logs on the browser. If all else fails, use Google's browser interface.

