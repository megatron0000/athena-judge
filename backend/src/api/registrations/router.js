import Express from "express";

import RegistrationsModel from "./model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await RegistrationsModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await RegistrationsModel.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.get("/registrationsstudents/:classId", async(req, res, next) => {
  try {
    let row = await RegistrationsModel.findAll({
      where:{ classId: req.params.classId }});
      res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

//@dicksiano hard coded!
router.post("/", async (req, res, next) => {
  try {
    let row = await RegistrationsModel.create({
        gid: req.body.gid,
        type: "Student",
        email: req.body.email,
        photo: req.body.photo,
        username: req.body.username,
        classId: req.body.classId
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await RegistrationsModel.update({
      // title: req.body.title,
      // description: req.body.description,
      // dueDate: req.body.dueDate,
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.put("/regpromote/:classId/:gid", async (req, res, next) => {
  try {
    let row = await RegistrationsModel.update({
      type: "Creator"
    }, { where: { gid: req.params.gid, classId: req.params.classId }
    });
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await RegistrationsModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;