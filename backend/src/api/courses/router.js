import Express from "express";

import CoursesModel from "./model";
import CoursesAssocModel from "../courses_assoc/model";
import UsersModel from "../users/model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await CoursesModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/enrolled/:userGid", async (req, res, next) => { 
  let courses = await CoursesModel.findAll({
    include: [{
      model: CoursesAssocModel,
      where: {
        userGid: req.params.userGid,
        role: "student",
      }
    }]
  });
  res.json({ data: courses });
});

router.get("/teaching/:userGid", async (req, res, next) => { 
  let courses = await CoursesModel.findAll({
    include: [{
      model: CoursesAssocModel,
      where: {
        userGid: req.params.userGid,
        role: "professor",
      }
    }]
  });
  res.json({ data: courses });
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await CoursesModel.findOne({ where: { id: req.params.id } });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/enroll", async (req, res, next) => {
  /*
  @vb: Race condition may allow double enrollment, but should hardly ever occur.
  */
  try {
    let row = await CoursesAssocModel.findOne({ where:
      { courseId: req.params.id, userGid: req.body.gid }
    });
    if (row == null) {
      await CoursesAssocModel.create({
        courseId: req.params.id,
        userGid: req.body.gid,
        role: "student",
      });
      res.json({ data: null });
    } else {
      res.json({ error: "AlreadyEnrolled" });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/:id/students", async (req, res, next) => {
  try {
    let users = await UsersModel.findAll({
      include: [{
        model: CoursesAssocModel,
        where: { courseId: req.params.id, role: "student" },
      }],
    });
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    let row = await CoursesModel.create({
      name: req.body.name,
      creatorGID: req.body.creatorGID,
      description: req.body.description
    });
    await CoursesAssocModel.create({
      userGid: req.body.creatorGID,
      courseId: row.dataValues.id,
      role: "professor",
    });
    res.json({ data: null });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await CoursesModel.update({
      id: req.body.id,
      name: req.body.name,
      creatorGID: req.body.creatorGID
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await CoursesModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;