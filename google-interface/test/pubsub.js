import { getProjectId } from '../src/credentials/config';

let assert = require('assert');
let request = require('request-promise-native');

require('../src/credentials/config');


const { getOAuth2ClientFromLocalCredentials } = require('../src/credentials/auth')
const { AttachPubSubListener, StopPubSub, StartPubSub } = require('../src/pubsub')
const { classroom_v1 } = require('googleapis')

describe('Pub/Sub', function () {

  this.timeout(60000);

  before(async () => StartPubSub())

  it('should enable listening for Classroom notifications', async () => {

    const auth = await getOAuth2ClientFromLocalCredentials(
      process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
      process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
    )

    const classroom = new classroom_v1.Classroom({ auth })

    await classroom.registrations.create({
      requestBody: {
        cloudPubsubTopic: {
          topicName: 'projects/' + (await getProjectId()) + '/topics/' + process.env['PUBSUB_TOPIC_SHORTNAME']
        },
        feed: {
          feedType: 'COURSE_WORK_CHANGES',
          courseWorkChangesInfo: {
            courseId: process.env['CLASSROOM_TEST_COURSE_ID']
          }
        }
      }
    })

    const { data } = await classroom.courses.courseWork.create({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      requestBody: {
        description: 'Test assignment. Should be automatically removed',
        title: 'Test Assignment',
        workType: 'ASSIGNMENT'
      }
    })

    return new Promise((resolve, reject) => {
      AttachPubSubListener(async (notification, ack) => {
        ack()
        await classroom.courses.courseWork.delete({
          id: data.id,
          courseId: process.env['CLASSROOM_TEST_COURSE_ID']
        })
        resolve()
      })
    })

  })

  after(async () => {
    await StopPubSub()
  })

});
