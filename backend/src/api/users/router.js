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
    let row = await UsersModel.findOne({ where: { gid: req.params.gid } });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
 
/*
@vb: Unused route. New users get registered through the PUT route.

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
*/

/*
@vb:
Everytime the Google Account login is sucessfull, the client should send
the new (if never loggged in on the site) or updated (if has logged in
previously) profile information to the server.

Note: It is not secure, i know... The client could spoof another's
identity...
*/
router.put("/:gid", async (req, res, next) => {
  try {
    let row = await UsersModel.upsert({
      gid: req.params.gid,
      name: req.body.name,
      photo: req.body.photo,
      email: req.body.email,
    });
    res.json({ data: row[0] });
  } catch (err) {
    next(err);
  }
});

/*
@vb: Unused. YOU CAN NOT LEAVE!

router.delete("/:gid", async (req, res, next) => {
  try {
    let row = await UsersModel.destroy({ where: { gid: req.params.gid }});
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});
*/

export default router;