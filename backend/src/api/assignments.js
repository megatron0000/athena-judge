import Express from "express";
import DB from "../db";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await DB.assignments.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let row = await DB.assignments.create({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.update({
      title: req.body.title,
      description: req.body.description,
      courseId: req.body.courseId,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await DB.assignments.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/submissions", async (req, res, next) => {
  try {
    let row = await DB.submissions.findAll({where: { assignmentId: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/tests", async (req, res, next) => {
  try {
    let row = await DB.assignments_tests.create({
      assignmentId: req.param.id,
      type: req.body.type,
      input: req.body.input,
      output: req.body.output,
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;