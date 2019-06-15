const Express = require("express")
const { DB } = require("../db")

const AssignmentsRouter = Express.Router()

AssignmentsRouter.get("/", async (req, res, next) => {
  try {
    let rows = await DB.assignments.findAll()
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.get("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.findById(req.params.id)
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.post("/", async (req, res, next) => {
  try {
    let row = await DB.assignments.create({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.put("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.update({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id } })
    res.json({ data: row[0] })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.delete("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.destroy({ where: { id: req.params.id } })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.get("/:id/submissions", async (req, res, next) => {
  try {
    let row = await DB.submissions.findAll({ where: { assignmentId: req.params.id } })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.get("/:id/tests", async (req, res, next) => {
  try {
    let rows = await DB.assignments_tests.findAll({ where: { assignmentId: req.params.id } })
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

AssignmentsRouter.post("/:id/tests", async (req, res, next) => {
  try {
    let row = await DB.assignments_tests.create({
      assignmentId: req.params.id,
      type: req.body.type,
      input: req.body.input,
      output: req.body.output,
    })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

module.exports = {
  AssignmentsRouter
}