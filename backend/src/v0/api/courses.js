const Express = require('express')
const { DB } = require('../db')

const CoursesRouter = Express.Router()

CoursesRouter.get("/", async (req, res, next) => {
  try {
    let rows = await DB.courses.findAll()
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.get("/enrolled/:userGid", async (req, res, next) => {
  let courses = await DB.courses.findAll({
    include: [{
      model: DB.courses_assoc,
      where: {
        userGid: req.params.userGid,
        role: "student",
      }
    }]
  })
  res.json({ data: courses })
})

CoursesRouter.get("/teaching/:userGid", async (req, res, next) => {
  let courses = await DB.courses.findAll({
    include: [{
      model: DB.courses_assoc,
      where: {
        userGid: req.params.userGid,
        role: "professor",
      }
    }]
  })
  res.json({ data: courses })
})

CoursesRouter.get("/:id", async (req, res, next) => {
  try {
    let row = await DB.courses.findOne({ where: { id: req.params.id } })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.post("/:id/students", async (req, res, next) => {
  /*
  @vb: Race condition may allow double enrollment, but should hardly ever occur.
  */
  try {
    let row = await DB.courses_assoc.findOne({
      where:
        { courseId: req.params.id, userGid: req.body.gid, role: "student" }
    })
    if (row == null) {
      await DB.courses_assoc.create({
        courseId: req.params.id,
        userGid: req.body.gid,
        role: "student",
      })
      res.json({ data: null })
    } else {
      res.json({ error: "AlreadyEnrolled" })
    }
  } catch (err) {
    next(err)
  }
})

CoursesRouter.get("/:id/students", async (req, res, next) => {
  try {
    let users = await DB.users.findAll({
      include: [{
        model: DB.courses_assoc,
        where: { courseId: req.params.id, role: "student" },
      }],
    })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.get("/:id/professors", async (req, res, next) => {
  try {
    let users = await DB.users.findAll({
      include: [{
        model: DB.courses_assoc,
        where: { courseId: req.params.id, role: "professor" },
      }],
    })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.post("/", async (req, res, next) => {
  try {
    let row = await DB.courses.create({
      name: req.body.name,
      creatorUserGid: req.body.creatorUserGid,
      description: req.body.description
    })
    await DB.courses_assoc.create({
      userGid: req.body.creatorUserGid,
      courseId: row.dataValues.id,
      role: "professor",
    })
    res.json({ data: null })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.put("/:id", async (req, res, next) => {
  try {
    let row = await DB.courses.update({
      id: req.body.id,
      name: req.body.name,
      creatorUserGid: req.body.creatorUserGid
    }, { where: { id: req.params.id } })
    res.json({ data: row[0] })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.delete("/:id", async (req, res, next) => {
  try {
    let row = await DB.courses.destroy({ where: { id: req.params.id } })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.post("/:id/professors", async (req, res, next) => {
  try {
    let userGid = req.body.userGid
    let row = await DB.courses_assoc.create({
      courseId: req.params.id,
      userGid: userGid,
      role: "professor",
    })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.delete("/:id/professors/:userGid", async (req, res, next) => {
  try {
    let row = await DB.courses_assoc.destroy({
      where: { userGid: req.params.userGid, role: "professor" }
    })
    res.json({ data: row })
  } catch (err) {
    next(err)
  }
})

CoursesRouter.get("/:id/assignments", async (req, res, next) => {
  try {
    let rows = await DB.assignments.findAll({ where: { courseId: req.params.id } })
    res.json({ data: rows })
  } catch (err) {
    next(err)
  }
})

module.exports = {
  CoursesRouter
}