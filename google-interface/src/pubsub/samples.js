/**
 * Sample functions to trigger various API tasks
 */

const { OAuth2Client } = require("googleapis-common");
const { google } = require('googleapis');

/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {OAuth2Client} auth An authorized OAuth2 client.
 */
exports.listCourses = listCourses
function listCourses(auth) {
  const classroom = google.classroom({
    version: 'v1',
    auth
  });
  classroom.courses.list({
    pageSize: 10,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courses = res.data.courses;
    if (courses && courses.length) {
      console.log('Courses:');
      courses.forEach((course) => {
        console.log(`${course.name} (${course.id})`);
      });
    } else {
      console.log('No courses found.');
    }
  });
}


/**
 * Creates a registration for notifications (from a fixed course and
 * to a fixed Pub/Sub topic)
 *
 * @param {OAuth2Client} auth An authorized OAuth2 client.
 */
exports.createClassroomRegistration = createClassroomRegistration
function createClassroomRegistration(auth) {
  const classroom = google.classroom({
    version: 'v1',
    auth
  });
  classroom.registrations.create({
    requestBody: {
      cloudPubsubTopic: {
        topicName: 'projects/ces29-athena/topics/PenguinTopic'
      },
      feed: {
        feedType: 'COURSE_WORK_CHANGES',
        courseWorkChangesInfo: {
          courseId: '31645086781'
        }
      }
    }
  }, (err, res) => {
    if (err) {
      console.log('Received error: ')
      console.log(err.response.data.error)
      return console.log(err)
    }
    console.log('Received response: ')
    console.log(res)
  })
}