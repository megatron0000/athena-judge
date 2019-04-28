require('../credentials/config')

const { Authenticate } = require('../credentials/auth')
const { AttachPubSubListener, StopPubSub } = require('../pubsub')
const { classroom_v1 } = require('googleapis')

describe('Integration', function () {
  this.timeout(60000)

  before(async () => {
    const auth = await Authenticate();
    this.classroomClient = new classroom_v1.Classroom({ auth });

    this.COURSE_ID = 31645086781;  // CES_TESTE course
    this.COURSEWORK_ID = 36000414864; // "teste novo" course work
  });

  it('should listen to CourseWork publish events and retrieve test files from GCS', async () => {
    AttachPubSubListener(async (pubsubMessage) => {
      // console.log(pubsubMessage);
    });
  });

})