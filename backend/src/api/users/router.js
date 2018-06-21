import Express from "express";
import DB from "../../db";

const router = Express.Router();

router.get("/", async (req, res, next) => {
  try {
    let rows = await DB.users.findAll();
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/:gid", async (req, res, next) => {
  try {
    let row = await DB.users.findOne({ where: { gid: req.params.gid } });
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
});

router.put("/:gid", async (req, res, next) => {
  try {
    let user = await DB.users.findOne({
      where: { gid: req.params.gid }
    });
    if (user == null) {
      await DB.users.create({
        gid: req.params.gid,
        name: req.body.name,
        photo: req.body.photo,
        email: req.body.email,
      });
    } else {
      await DB.users.update({
        name: req.body.name,
        photo: req.body.photo,
        email: req.body.email,
      }, {
        where: { gid: req.params.gid }
      });
    }
    res.json({ data: null });
  } catch (err) {
    next(err);
  }
});

export default router;