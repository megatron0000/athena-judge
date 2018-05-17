import Express from "express";

import AssignmentsRouter from "./assignments/router";
import ClassesRouter from "./classes/router";
import UsersRouter from "./users/router";

import ClassesModel from "./classes/model";
import RegistrModel from "./registrations/model";
import UsersModel from "./users/model";

const router = Express.Router();

router.use("/assignments", AssignmentsRouter);
router.use("/classes", ClassesRouter);
router.use("/users", UsersRouter);
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
        classid: row.dataValues.id
      })
      res.json({ data: row, dataReg: rowtemp });
    } catch (err) {
      next(err);
    }
  } catch (err) {
    next(err);
  }
});

export default router;