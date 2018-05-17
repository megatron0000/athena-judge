import Express from "express";

import UsersModel from "./model";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await UsersModel.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:gid", async (req, res, next) => {
  try {
    let row = await UsersModel.findById(req.params.gid);
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
 
router.post("/", async (req, res, next) => {
  try {
    let row = await UsersModel.create({
      gid: req.body.gid,
      name: req.body.name,
      photo: req.body.photo,
      email: req.body.email
    });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let row = await UsersModel.update({
      gid: req.body.gid,
      name: req.body.name,
      photo: req.body.photo,
      email: req.body.email
    }, { where: { gid: req.params.gid }});
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/:gid", async (req, res, next) => {
  try {
    let row = await UsersModel.destroy({ where: { gid: req.params.gid }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

export default router;