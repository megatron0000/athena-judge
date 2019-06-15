const Express = require('express')

const { AssignmentsRouter } = require('./assignments')
const { CoursesRouter } = require('./courses')
const { UsersRouter } = require('./users')
const { SubmissionsRouter } = require('./submissions')
const { InfoRouter } = require('./info')

const ApiRouter = Express.Router()

ApiRouter.use('/assignments', AssignmentsRouter)
ApiRouter.use('/courses', CoursesRouter)
ApiRouter.use('/users', UsersRouter)
ApiRouter.use('/submissions', SubmissionsRouter)
ApiRouter.use('/info', InfoRouter)

module.exports = {
  ApiRouter
}
