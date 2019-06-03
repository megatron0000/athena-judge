const { sendAckResponseEmail, sendErrorEmail, sendDiffMail } = require('../src/emailer/index.js')
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

describe('Send Error Email', () => {

    it('should send error email correctly for the student', async () => {
        const teacherAuth = await getOAuth2ClientFromLocalCredentials(
            process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
            process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
        )
      
        sendErrorEmail(teacherAuth, { name: "Eric Moreira", email: "ericpqueiroz@gmail.com"})   
    })
})

describe('Send Diff Email', () => {

    it('should send email with highlights of the test cases gone wrong', async () => {
        const teacherAuth = await getOAuth2ClientFromLocalCredentials(
            process.env['OAUTH_CLIENT_PROJECT_CREDENTIALS_FILE'],
            process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
        )

        text1 = "3\n2\n2\n5\n";
        text2 = "3\n2\n5\n4\n";

        sendDiffMail(teacherAuth, { name: "Eric Moreira", email: "ericpqueiroz@gmail.com"}, text1, text2);
    })
})