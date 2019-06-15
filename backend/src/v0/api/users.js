const Express = require('express')
const { DB } = require('../db')
const { OAuth2Client } = require('google-auth-library')
const { getProjectOAuthClientId } = require('../google-interface/credentials/config')
const Passport = require('passport')

const UsersRouter = Express.Router()

UsersRouter.get("/", async (req, res, next) => {
  try {
    let rows = await DB.users.findAll()
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

async function verifyToken(gid, id_token) {
  const oauthClient = new OAuth2Client(gid)

  let googleUserInfo
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: await getProjectOAuthClientId()
    })
    googleUserInfo = ticket.getPayload()
  } catch (err) {
    console.error(err)
    googleUserInfo = null
  }

  return googleUserInfo
}



/**
 * User login (merely creation of a session) based on 'id_token' created by google on client-side
 */
UsersRouter.put("/login", async (req, res) => {
  const googleUserInfo = await verifyToken(req.body.gid, req.body.id_token)
  console.log(googleUserInfo)

  if (!googleUserInfo) {
    return res.status(401).json({ error: "UnauthorizedError", message: "Usuário não autenticado" })
  }

  const { sub: gid, email, name, picture } = googleUserInfo

  req.session.googleUserInfo = { gid, email, name, picture, hasOfflineCreds: false }

  return res.status(200).end()
})

UsersRouter.put('/give-offline-permission', Passport.authenticate('google-authcode', { session: false }), async (req, res) => {
  console.log('req user: ', req.user)
  res.end(200)
})

module.exports = {
  UsersRouter
}