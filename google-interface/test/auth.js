let assert = require('assert');
let request = require('request-promise-native');

require('../src/credentials/config');


const { getOAuth2ClientFromLocalCredentials } = require('../src/credentials/auth')
const { classroom_v1 } = require('googleapis')

describe('Authentication', function () {

  this.timeout(60000);

  it('should use locally-stored credentials automatically', async () => {

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

    await classroom.courses.courseWork.delete({
      id: data.id,
      courseId: process.env['CLASSROOM_TEST_COURSE_ID']
    })

  })

});
