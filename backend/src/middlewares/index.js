const { getProjectOAuthClientId } = require('../google-interface/credentials/config')
const { OAuth2Client } = require('google-auth-library')


async function verifyToken(gid, id_token) {

  try {
    const oauthClient = new OAuth2Client(gid)
    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: await getProjectOAuthClientId()
    })
    const googleUserInfo = ticket.getPayload()

    return {
      gid: googleUserInfo.sub,
      email: googleUserInfo.email,
      name: googleUserInfo.name,
      picture: googleUserInfo.picture
    }

  } catch (err) {
    return null
  }

}


/**
 * Asserts the Authorization header and also populates req.user
 */
function authenticateOrDrop() {
  return async (/**@type {import('express').Request} */req, res, next) => {
    const [gid, id_token] = (req.header('Authorization') || ':').split(':')
    const user = await verifyToken(gid, id_token)

    if (!user) {
      return res.status(401).json({ error: "Unauthorized", message: "Usuário não autenticado" })
    }

    req.user = user
    return next()
  }
}

/**
 * 
 * @param {(req: import('express').Request) => string | false | Promise<string | false>} verifier Returns a string to signal an error 
 * (the string will be the message) or a falsy value to signal that all is well with the request body
 */
function assertRequestFormat(verifier) {
  return async (req, res, next) => {
    const errorMessage = await verifier(req)
    if (errorMessage) {
      return res.status(400).json({ error: 'BadRequest', message: errorMessage })
    }

    return next()
  }
}

/**
 * 
 * @param {(req: import('express').Request) => string | false | Promise<string | false>} verifier Returns a string to signal an error 
 * (the string will be the message) or a falsy value to signal that all is well with the request
 */
function assertPrecondition(verifier) {
  return async (req, res, next) => {
    const errorMessage = await verifier(req)
    if (errorMessage) {
      return res.status(424).json({ error: 'FailedDependency', message: errorMessage })
    }

    return next()
  }
}

/**
 * 
 * @param {(req: import('express').Request) => string | false | Promise<string | false>} verifier Returns a string to signal an error 
 * (the string will be the message) or a falsy value to signal that all is well with the request
 */
function assertPermission(verifier) {
  return async (req, res, next) => {
    const errorMessage = await verifier(req)
    if (errorMessage) {
      return res.status(403).json({ error: 'Forbidden', message: errorMessage })
    }

    return next()
  }
}



module.exports = {
  authenticateOrDrop,
  assertRequestFormat,
  assertPrecondition,
  assertPermission
}