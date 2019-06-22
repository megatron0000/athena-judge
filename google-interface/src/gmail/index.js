const { getOAuth2ClientFromCloudStorage } = require('../credentials/auth')
const { getTeacherInfo, getStudentInfoFromSubmission, getCourseName } = require('../classroom')

const nodemailer = require("nodemailer");
const diff = require("diff");

async function sendSubmissionAcknowledgeEmail(courseId, courseWorkId, submissionId) {
  const [teacherInfo, studentInfo, courseName] = await Promise.all([
    getTeacherInfo(courseId),
    getStudentInfoFromSubmission(courseId, courseWorkId, submissionId),
    getCourseName(courseId)
  ])
  return sendEmailToStudentFromSubmission(
    courseId,
    courseWorkId,
    submissionId,
    `${courseName}: Submissão recebida com sucesso`,
    `<html>
      <head></head>
      <body>
          <p>Olá, ${studentInfo.name}! <br /><br /> Sua submissão foi recebida com sucesso e em breve será
          corrigida automaticamente pelo <b>Athena</b></p>

          <p>Você receberá um e-mail com o resultado de sua submissão em breve.
          Caso isso não ocorra, entre em contato comigo.</p>

          <p>Se você não tiver submetido uma atividade porém estiver recebendo esse e-mail,
          entre em contato comigo imediatamente!</p>

          <p>Atenciosamente, <br /> ${teacherInfo.name}. </p>

          <p>(email enviado automaticamente pelo Athena) </p>
      </body>
    </html>`
  )
}

/**
 * @typedef {object} TestResult
 * @property {boolean} pass
 * @property {string} input
 * @property {string} expectedOutput
 * @property {string} output
 * @property {string} error
 * @property {boolean} isPrivate
 * @property {number} weight
 */

/**
 * @typedef {object} Status
 * @property {boolean} ok
 * @property {string} message
 * @property {string=} additionalInfo
 */

/**
 * 
 * @param {string} courseId 
 * @param {string} courseWorkId 
 * @param {string} submissionId 
 * @param {{status: Status, testResults: TestResult[]}} testInfo
 */
async function sendCorrectionResultEmail(courseId, courseWorkId, submissionId, testInfo) {
  const [teacherInfo, studentInfo, courseName] = await Promise.all([
    getTeacherInfo(courseId),
    getStudentInfoFromSubmission(courseId, courseWorkId, submissionId),
    getCourseName(courseId)
  ])
  return sendEmailToStudentFromSubmission(
    courseId,
    courseWorkId,
    submissionId,
    `${courseName}: Resultados da correção`,
    `<html>
      <head></head>
      <body>
        <h2>Status</h2>
        <pre>${testInfo.status}</pre>

        <h2>Resultados</h2>
        ${testInfo.testResults.map(x => '<pre>' + x + '</pre>').join('<br/><br/>')}
      </body>
    </html>`
  )
}

async function sendEmailToStudentFromSubmission(courseId, courseWorkId, submissionId, emailSubject, emailHtmlContent) {
  const [auth, teacherInfo, studentInfo] = await Promise.all([
    getOAuth2ClientFromCloudStorage(courseId),
    getTeacherInfo(courseId),
    getStudentInfoFromSubmission(courseId, courseWorkId, submissionId)
  ])

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    auth: {
      type: 'OAuth2',
      user: teacherInfo.email,
      clientId: auth._clientId,
      clientSecret: auth._clientSecret,
      refreshToken: auth.credentials.refresh_token,
      accessToken: auth.credentials.access_token,
      expires: auth.credentials.expiry_date
    }
  })

  return await transporter.sendMail({
    from: '"' + teacherInfo.name + '" <' + teacherInfo.email + '>',
    to: /* studentInfo.email */ 'vitor.pimenta.arruda@gmail.com',
    subject: emailSubject,
    html: emailHtmlContent
  })
}


const sendAckResponseEmail = async (teacherAuth, student) => {
  sendEmail(teacherAuth, {
    subject: "Sua submissão foi recebida com sucesso",
    text:
      `
            <html>
                <head></head>
                <body>
                    <p>Olá, aluno(a) ${student.name}! <br /><br /> Sua submissão foi recebida com sucesso e em breve será
                    corrigida automaticamente pelo <b>Athena Judge.</b></p>

                    <p>Você receberá um e-mail com o resultado de sua submissão em breve.
                    Caso isso não ocorra, entre em contato comigo.</p>

                    <p>Se você não tiver submetido uma atividade porém estiver recebendo esse e-mail,
                    entre em contato comigo imediatamente!</p>

                    <p>Atenciosamente, <br /> Professor(a). </p>
                </body>
            </html>
        `
  }, [student.email])
}

const sendErrorEmail = async (teacherAuth, student, error) => {
  sendEmail(teacherAuth, {
    subject: "Ocorreu um erro ao compilar sua submissão!",
    text:
      `
            <html>
                <head></head>
                <body>
                    <p>Olá, aluno(a) ${student.name}! <br /><br /> Sua submissão foi recebida, porém o seguinte erro ocorreu
                    ao tentar executar seu código: ${error}.</b></p>

                    <p>Atenciosamente, <br /> Professor(a). </p>
                </body>
            </html>
        `
  })
}

const sendDiffMail = async (teacherAuth, student, txt1, txt2) => {
  wrongCasesList = diff.diffLines(txt1, txt2)
  wrongCasesStr = "";

  for (i = 0; i < wrongCasesList.length(); i++)
    wrongCasesStr += "Linha i: " + wrongCasesList[i] + "\n";

  sendEmail(teacherAuth, {
    subject: "Resultado da submissão da atividade",
    text:
      `
            <html>
                <head></head>
                <body>
                    <p>Olá, aluno(a) ${student.name}! <br /><br /> Segue o resultado da submissão de sua atividade.</b></p>

                    <p>Os casos que resultaram em erro foram: </p>

                    <p>${wrongCasesStr} </p>

                    <p>Se você tem alguma dúvida sobre os casos teste,
                    entre em contato comigo imediatamente!</p>

                    <p>Atenciosamente, <br /> Professor(a). </p>
                </body>
            </html>
        `
  })
}

const sendEmail = async (oauth, emailContent, destList) => {
  console.log("Oauth", JSON.stringify(oauth, undefined, 1))
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    auth: {
      type: 'OAuth2',
      user: 'vitor.arruda@ga.ita.br',
      clientId: oauth._clientId,
      clientSecret: oauth._clientSecret,
      refreshToken: oauth.credentials.refresh_token,
      accessToken: oauth.credentials.access_token,
      expires: oauth.credentials.expiry_date
    }
  });

  let info = await transporter.sendMail({
    from: '"Vitor Arruda" <vitor.arruda@ga.ita.br>',
    to: destList.join(", "),
    subject: emailContent.subject,
    html: emailContent.text
  });

  console.log(`Message sent: ${info.messageId}`);
  console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}

module.exports = {
  sendSubmissionAcknowledgeEmail,
  sendCorrectionResultEmail
}