const Express = require("express")
const Cors = require("cors")
const Passport = require('passport')
const { Strategy: GoogleAuthCodeStrategy } = require('passport-google-authcode')
const { getProjectOAuthClientId, getProjectOAuthClientSecret, getProjectLocalhostRedirectUri } = require('./google-interface/credentials/config')

const { ApiRouter } = require("./api/api")

const { Config } = require("./config")

const RandomString = require('crypto-random-string')

async function main() {
  const app = Express()

  Passport.use(
    new GoogleAuthCodeStrategy({
      clientID: await getProjectOAuthClientId(),
      clientSecret: await getProjectOAuthClientSecret(),
      callbackURL: await getProjectLocalhostRedirectUri()
    }, async (accessToken, refreshToken, profile, done) => {
      console.log(accessToken, refreshToken, profile)
      // pass away the access and refresh tokens, because whoever called passport.authenticate() (from
      // where this function was ultimately called) will want them later. By passing them as argument
      // to done, we are telling passport to construct req.user with our object
      done(null, { accessToken, refreshToken })
    })
  )

  app.use(Cors())

  app.use(Express.urlencoded({ extended: true }))
  app.use(Express.json())
  app.use(Passport.initialize())
  app.use(Passport.session())

  app.get("/", (req, res) => {
    res.json({ data: "OK" })
  })

  app.use("/api", ApiRouter)

  app.use((req, res, next) => {
    req.url

    res.status(404)
    res.json({ error: "NotFound", message: "Não encontrado" })
  })

  app.use((err, req, res, next) => {
    console.log(err.stack)
    res.status(500)
    res.json({ error: "InternalServerError", message: err.message })
  })

  app.listen(Config.PORT, () => {
    console.log(`Server running at port ${Config.PORT}`)
  })


}

main()