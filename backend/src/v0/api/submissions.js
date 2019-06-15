const Express = require('express')
const { DB } = require('../db')

const SubmissionsRouter = Express.Router();

SubmissionsRouter.get("/", async (req, res, next) => {
  try {
    let rows = await DB.submissions.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

SubmissionsRouter.get("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

SubmissionsRouter.post("/", async (req, res, next) => {
  try {
    let row = await DB.submissions.create({
      studentUserGid: req.body.usergid,
      studentEmail: req.body.email,
      assignmentId: req.body.assignmentId,
      studentName: req.body.username,
      courseId: req.body.courseId,
      code: req.body.code,
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

SubmissionsRouter.put("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.update({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id } });
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

SubmissionsRouter.delete("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.destroy({ where: { id: req.params.id } });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  SubmissionsRouter
}