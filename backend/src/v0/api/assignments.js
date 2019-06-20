const Express = require("express")
const { downloadCourseWorkTestFilesMetadata, downloadCourseWorkTestFilesToMemory, hasTeacherCredential } = require('../google-interface/cloudstorage')
const { getTeacherGids } = require('../google-interface/classroom')
const { assertPrecondition, assertPermission, authenticateOrDrop } = require('../middlewares')

const AssignmentsRouter = Express.Router()

AssignmentsRouter.get('/test-files-metadata/:courseId/:courseWorkId',
  authenticateOrDrop(),
  assertPrecondition(async req => {
    if (!await hasTeacherCredential(req.params.courseId)) {
      return 'O sistema nao tem permissao para acessar este curso'
    }
  }),
  assertPermission(async req => {
    if ((await getTeacherGids(req.params.courseId)).indexOf(req.user.gid) === -1) {
      return 'Voce nao e professor do curso'
    }
  }),
  async (req, res) => {
    const { courseId, courseWorkId } = req.params
    return res.json(await downloadCourseWorkTestFilesMetadata(courseId, courseWorkId))
  }
)

AssignmentsRouter.get('/test-files/:courseId/:courseWorkId',
  authenticateOrDrop(),
  assertPrecondition(async req => {
    if (!await hasTeacherCredential(req.params.courseId)) {
      return 'O sistema nao tem permissao para acessar este curso'
    }
  }),
  assertPermission(async req => {
    if ((await getTeacherGids(req.params.courseId)).indexOf(req.user.gid) === -1) {
      return 'Voce nao e professor do curso'
    }
  }),
  async (req, res) => {
    const { courseId, courseWorkId } = req.params
    return res.json(await downloadCourseWorkTestFilesToMemory(courseId, courseWorkId))
  }
)

module.exports = {
  AssignmentsRouter
}