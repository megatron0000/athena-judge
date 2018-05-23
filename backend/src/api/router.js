import Express from "express";
import Multer from "multer"
import FileSystem from "fs"

import AssignmentsRouter from "./assignments/router";
import ClassesRouter from "./classes/router";
import UsersRouter from "./users/router";
import RegistrRouter from "./registrations/router";
import SubmissionsRouter from "./submissions/router";

import ClassesModel from "./classes/model";
import RegistrModel from "./registrations/model";
import UsersModel from "./users/model";

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
  foreignKey: 'classid', // Key in RegistrModel
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
    try {
      //@italotabatinga: dont know if this is the right way but
      // it works
      let rowtemp = await RegistrModel.create({
        gid: req.body.creatorGID,
        type: req.body.type,
        email: req.body.email,
        photo: req.body.photo,
        username: req.body.username,
        classid: row.dataValues.id
      })
      FileSystem.mkdir('static/' + row.id);
      res.json({ data: row, dataReg: rowtemp });
    } catch (err) {
      next(err);
    }
  } catch (err) {
    next(err);
  }
});

router.get("/registrationsclass/:classid", async (req, res, next) => {
  console.log("cheguei aq", req.params.classid);
  try {
    let row = await UsersModel.findAll({
      include: [{
        model: RegistrModel,
        where: {
          classid: '1'
        }
      }]
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;