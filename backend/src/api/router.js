import Express from "express";
import Multer from "multer";
import FileSystem from "fs";
import Path from "path";

import AssignmentsRouter from "./assignments/router";
import ClassesRouter from "./classes/router";
import UsersRouter from "./users/router";
import RegistrRouter from "./registrations/router";
import SubmissionsRouter from "./submissions/router";

import ClassesModel from "./classes/model";
import RegistrModel from "./registrations/model";
import UsersModel from "./users/model";

import { UPLOADS_DIR } from "../config";

const upload = Multer();
const router = Express.Router();

router.use("/assignments", AssignmentsRouter);
router.use("/classes", ClassesRouter);
router.use("/users", UsersRouter);
router.use("/registrations", RegistrRouter);
router.use("/submissions", SubmissionsRouter);
// router.use("/assignments", AssignmentsRouter);
// router.use("/assignments", AssignmentsRouter);
// router.use("/assignments", AssignmentsRouter);

ClassesModel.hasMany(RegistrModel, {
  foreignKey: 'classId', // Key in RegistrModel
  sourceKey: 'id' // Key in ClassesModel
});

UsersModel.hasMany(RegistrModel, {
  foreignKey: 'gid', // Key in RegistrModel
  sourceKey: 'gid' // Key in UsersModel
});

router.get("/classesgid/:id", async (req, res, next) => {
  try {
    let row = await ClassesModel.findAll({
      include: [{
        model: RegistrModel,
        where: {
          gid: req.params.id
        }
      }]
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.post("/classes", async (req, res, next) => {
  try {
    let row = await ClassesModel.create({
      name: req.body.name,
      creatorGID: req.body.creatorGID,
      description: req.body.description
    });
    let rowtemp = await RegistrModel.create({
      gid: req.body.creatorGID,
      type: req.body.type,
      email: req.body.email,
      photo: req.body.photo,
      username: req.body.username,
      classId: row.dataValues.id
    });
    res.json({ data: row, dataReg: rowtemp });
  } catch (err) {
    next(err);
  }
});

router.get("/registrationsclass/:classId", async (req, res, next) => {
  console.log("cheguei aq", req.params.classId);
  try {
    let row = await UsersModel.findAll({
      include: [{
        model: RegistrModel,
        where: {
          classId: '1'
        }
      }]
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;