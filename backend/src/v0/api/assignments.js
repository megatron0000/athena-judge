const Express = require("express")
const { downloadCourseWorkTestFilesMetadata, downloadCourseWorkTestFilesToMemory, hasTeacherCredential, uploadCourseWorkTestFilesFromMemory } = require('../google-interface/cloudstorage')
const { getTeacherGids } = require('../google-interface/classroom')
const { assertPrecondition, assertPermission, authenticateOrDrop, assertRequestFormat } = require('../middlewares')

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

/**
 * TODO: Do this properly: Uploading all test files at once does not scale.
 * Should allow for uploading "incrementally", meaning to upload only the
 * changes with respect to the files already contained in Cloud Storage
 */
AssignmentsRouter.put('/test-files/:courseId/:courseWorkId',
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
  assertRequestFormat(req => {
    const { body } = req
    if (!body) {
      return 'Corpo do pedido mal-formado'
    }

    if (!Array.isArray(body)) {
      return 'Esperada uma lista de especificacoes de teste'
    }

    for (let i = 0; i < body.length; i++) {
      const testSpec = body[i]
      if (typeof testSpec.isPrivate !== 'boolean') {
        return 'Corpo do teste ' + i + ' mal-formado: isPrivate'
      }
      if (typeof testSpec.weight !== 'number' || testSpec.weight !== parseInt(testSpec.weight)) {
        return 'Corpo do teste ' + i + ' mal-formado: weight'
      }
      if (typeof testSpec.input !== 'string') {
        return 'Corpo do teste ' + i + ' mal-formado: input'
      }
      if (typeof testSpec.output !== 'string') {
        return 'Corpo do teste ' + i + ' mal-formado: output'
      }
    }
  }),
  async (req, res, next) => {
    const testSpecList = req.body
    try {
      await uploadCourseWorkTestFilesFromMemory(req.params.courseId, req.params.courseWorkId, testSpecList)
    } catch (err) {
      console.error(err)
      return next(err)
    }
    return res.status(200).end()
  }
)

module.exports = {
  AssignmentsRouter
}