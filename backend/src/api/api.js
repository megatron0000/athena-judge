const Express = require('express')

const { AssignmentsRouter } = require('./assignments')
const { CoursesRouter } = require('./courses')
const { InfoRouter } = require('./info')

const ApiRouter = Express.Router()

ApiRouter.use('/assignments', AssignmentsRouter)
ApiRouter.use('/courses', CoursesRouter)
ApiRouter.use('/info', InfoRouter)

module.exports = {
  ApiRouter
}
