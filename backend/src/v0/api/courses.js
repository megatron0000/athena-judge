const Express = require('express')
const Passport = require('passport')
const { authenticateOrDrop, assertRequestFormat } = require('../middlewares')
const { hasTeacherCredential, uploadTeacherCredentialFromMemory } = require('../google-interface/cloudstorage')

const CoursesRouter = Express.Router()


CoursesRouter.get('/credentials/:courseId',
  authenticateOrDrop(),
  async (req, res) => res.json({ hasCredentials: await hasTeacherCredential(req.params.courseId) })
)

CoursesRouter.put('/credentials',
  assertRequestFormat(req => {
    if (!req.body) {
      return 'Corpo do pedido mal-formado'
    }

    if (!req.body.courseId) {
      return 'Falta courseId'
    }
  }),
  Passport.authenticate('google-authcode', { session: false }),
  async (req, res) => {
    await uploadTeacherCredentialFromMemory(req.body.courseId, req.user.accessToken, req.user.refreshToken)
    return res.status(200).end()
  }
)

module.exports = {
  CoursesRouter
}