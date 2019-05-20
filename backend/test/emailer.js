const { sendAckResponseEmail } = require('../src/emailer/index.js')
const { getOAuth2ClientFromLocalCredentials } = require('../src/google-interface/credentials/auth')

describe('Send Email', () => {

    it('should send email correctly for the student', async () => {
        const teacherAuth = await getOAuth2ClientFromLocalCredentials(
            process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
            process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
        )
      
        sendAckResponseEmail(teacherAuth, { name: "Eric Moreira", email: "ericpqueiroz@gmail.com"})
    })

})