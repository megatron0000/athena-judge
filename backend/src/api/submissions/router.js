import Express from "express";

import SubmissionsModel from "./model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await SubmissionsModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/submissionsassig/:assignid", async (req, res, next) => {
  try {
    let row = await SubmissionsModel.findAll({where: {assignmentID: req.params.assignid}});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/", async(req, res, next) => {
  try {
    let row = await SubmissionsModel.create({
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
    let row = await SubmissionsModel.update({
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
    let row = await SubmissionsModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;