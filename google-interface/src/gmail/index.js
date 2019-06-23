const { getOAuth2ClientFromCloudStorage } = require('../credentials/auth')
const { getCredentialedTeacherInfo, getStudentInfoFromSubmission, getCourseName } = require('../classroom')

const nodemailer = require('nodemailer')

async function sendSubmissionAcknowledgeEmail(courseId, courseWorkId, submissionId) {
  const [teacherInfo, studentInfo, courseName] = await Promise.all([
    getCredentialedTeacherInfo(courseId),
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
    getCredentialedTeacherInfo(courseId),
    getStudentInfoFromSubmission(courseId, courseWorkId, submissionId),
    getCourseName(courseId)
  ])

  const privateTestCount = testInfo.testResults.filter(x => x.isPrivate).length
  const privatePassingTestCount = testInfo.testResults.filter(x => x.isPrivate && x.pass).length
  const publicTests = testInfo.testResults.filter(x => !x.isPrivate)

  const template = testInfo.status.ok
    ? `
    <html>
      <head>
        <style>
          table {
            border-collapse: collapse;
          }

          td,
          th {
            border: 1px solid;
            padding: 5px;
          }

          tr:nth-child(even) {
            background-color: #eee;
          }
          
          tr:nth-child(odd) {
            background-color: #fff;
          }
        </style>
      </head>
      <body>
        <h2>Status</h2>
        <p>O Athena não encontrou nenhum erro fatal. Os casos de teste foram executados.</p>

        <h3>Mensagem de status</h3>
        <pre>${testInfo.status.message || 'Nenhuma mensagem'}</pre>

        <h3>Informação adicional</h3>
        <pre>${testInfo.status.additionalInfo || 'Nenhuma informação adicional'}</pre>

        <h2>Resultados dos casos de teste</h2>
        
        <h3>Testes privados</h3>
        <p>Você acertou ${privatePassingTestCount} de ${privateTestCount} teste(s) privado(s)</p>

        <h3>Testes públicos</h3>
        <table>
          <thead>
            <tr>
              <th>Passou ?</th>
              <th>Erros</th>
              <th>Saída</th>
              <th>Saída esperada</th>
              <th>Entrada</th>
            </tr>
          </thead>
          <tbody>
            ${publicTests.map(test => `
            <tr>
              <td>${test.pass ? 'Sim' : 'Não'}</td>
              <td><pre>${test.error || 'Nenhum erro'}</pre></td>
              <td><pre>${test.output}</pre></td>
              <td><pre>${test.expectedOutput}</pre></td>
              <td><pre>${test.input}</pre></td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </body>
    </html>
    `
    : `
    <html>
      <head></head>
      <body>
        <h2>Status</h2>
        <p>O Athena encontrou um erro fatal (não foi possível executar os casos de teste)</p>

        <h3>Mensagem do erro</h3>
        <pre>${testInfo.status.message}</pre>

        <h3>Informação adicional</h3>
        <pre>${testInfo.status.additionalInfo || 'Nenhuma informação adicional'}</pre>

        <h2>Resultados dos casos de teste</h2>
        <p>Os testes não foram executados, por causa do erro acima</p>
      </body>
    </html>
    `

  return sendEmailToStudentFromSubmission(
    courseId,
    courseWorkId,
    submissionId,
    `${courseName}: Resultados da correção`,
    template
  )
}

async function sendEmailToStudentFromSubmission(courseId, courseWorkId, submissionId, emailSubject, emailHtmlContent) {
  const [auth, teacherInfo, studentInfo] = await Promise.all([
    getOAuth2ClientFromCloudStorage(courseId),
    getCredentialedTeacherInfo(courseId),
    /**getStudentInfoFromSubmission(courseId, courseWorkId, submissionId)*/{}
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
    to: /** studentInfo.email*/ 'vitor.pimenta.arruda@gmail.com',
    subject: emailSubject,
    html: emailHtmlContent
  })
}

module.exports = {
  sendSubmissionAcknowledgeEmail,
  sendCorrectionResultEmail,
  sendEmailToStudentFromSubmission
}