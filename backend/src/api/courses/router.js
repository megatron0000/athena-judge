import Express from "express";

import CoursesModel from "./model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await CoursesModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let row = await CoursesModel.findById(req.params.id);
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
//     let row = await CoursesModel.create({
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
    let row = await CoursesModel.update({
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
    let row = await CoursesModel.destroy({ where: { id: req.params.id }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;