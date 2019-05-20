import Express from "express";
import DB from "../db";

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
  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(req.body.gid);
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: req.body.id_token,
        audience: req.body.gid,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const gid = payload['sub'];
    try {
      let row = await DB.users.findOne({ where: { gid: gid } });
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  }
  verify().catch(console.error);
});

router.put("/:gid", async (req, res, next) => {
  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(req.body.gid);
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: req.body.id_token,
        audience: req.body.gid,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const gid = payload['sub'];
    const name = payload['name'];
    const photo = payload['picture'];
    const email = payload['email'];
    
    /*
    @vb: race condition. sequelize's upsert would be better since it its atomic, but
    i couldn't get it to work.
    */
    try {
      let user = await DB.users.findOne({
        where: { gid: gid }
      });
      if (user == null) {
        await DB.users.create({
          gid: gid,
          name: name,
          photo: photo,
          email: email,
        });
      } else {
        await DB.users.update({
          name: name,
          photo: photo,
          email: email,
        }, {
          where: { gid: gid }
        });
      }
      res.json({ data: null });
    } catch (err) {
      next(err);
    }
  }
  verify().catch(console.error);
});

export default router;