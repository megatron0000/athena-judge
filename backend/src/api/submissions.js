import Express from "express";
import DB from "../db";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await DB.submissions.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/", async(req, res, next) => {
  try {
    let row = await DB.submissions.create({
      studentGID: req.body.usergid,
      studentEmail: req.body.email,
      assignmentID: req.body.assignid,
      studentName: req.body.username,
      courseId: req.body.courseId,
      code: req.body.code,
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.update({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await DB.submissions.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;