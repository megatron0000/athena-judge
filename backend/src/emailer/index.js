const nodemailer = require("nodemailer");

export const sendAckResponseEmail = async (teacherAuth, student) => {
    sendEmail(teacherAuth, { 
        subject: "Sua submissão foi recebida com sucesso",
        text: `
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
    }, [ student.email ])
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
