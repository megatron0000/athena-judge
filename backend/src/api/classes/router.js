import Express from "express";

import ClassesModel from "./model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await ClassesModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await ClassesModel.findById(req.params.id);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

// @italotabatinga: now this code is on the general router cause it also has a post req to
// registrations table
// 
// router.post("/", async (req, res, next) => {
//   try {
//     let row = await ClassesModel.create({
//       id: req.body.id,
//       name: req.body.name,
//       professorID: req.body.creatorGID,
//       description: req.body.description
//     });
//     res.json({ data: row });
//   } catch (err) {
//     next(err);
//   }
// });

router.put("/:id", async (req, res, next) => {
  try {
    let row = await ClassesModel.update({
      id: req.body.id,
      name: req.body.name,
      professorID: req.body.professorID
    }, { where: { id: req.params.id }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let row = await ClassesModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;