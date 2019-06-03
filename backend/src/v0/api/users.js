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

async function verifyToken(req) {
  const {OAuth2Client} = require('google-auth-library');
  const client = new OAuth2Client(req.body.gid);
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.id_token,
      audience: req.body.gid,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    payload = ticket.getPayload();
  } catch(err) {
    console.error(err);
    payload = null;
  }

  return payload;
}

router.get("/:gid", async (req, res, next) => {
  const payload = await verifyToken(req);

  console.log(payload)

  if (payload != null) {
    try {
      let payload = await verifyToken(req);
      let gid = payload['sub'];
      let row = await DB.users.findOne({ where: { gid: gid } });
      res.json({ data: row });
    } catch (err) {
      next(err);
    }  
  } else {
    res.status(401);
    res.json({ error: "UnauthorizedError", message: "Usuário não autenticado"});
    console.log(res);
  }
});

router.put("/:gid", async (req, res, next) => {
  /*
  @vb: race condition. sequelize's upsert would be better since it its atomic, but
  i couldn't get it to work.
  */
  const payload = await verifyToken(req);
  console.log(payload)

  if (payload != null) {
    try {
      const gid = payload['sub'];
      const name = payload['name'];
      const photo = payload['picture'];
      const email = payload['email'];

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
  } else {
    res.status(401);
    res.json({ error: "UnauthorizedError", message: "Usuário não autenticado"});
  }
});

export default router;