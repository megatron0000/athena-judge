let assert = require('assert');
let request = require('request-promise-native');

require('../src/credentials/config');


const { getOAuth2ClientFromLocalCredentials } = require('../src/credentials/auth')
const { AttachPubSubListener, StopPubSub } = require('../src/pubsub')
const { classroom_v1 } = require('googleapis')

describe('Pub/Sub', function () {

  this.timeout(60000);

  it('should enable listening for Classroom notifications', async () => {

    const auth = await getOAuth2ClientFromLocalCredentials()
    const classroom = new classroom_v1.Classroom({ auth })

    const { data } = await classroom.courses.courseWork.create({
      courseId: process.env['CLASSROOM_TEST_COURSE_ID'],
      requestBody: {
        description: 'Test assignment. Should be automatically removed',
        title: 'Test Assignment',
        workType: 'ASSIGNMENT'
      }
    })
    
    return new Promise((resolve, reject) => {
      AttachPubSubListener(async () => {
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
