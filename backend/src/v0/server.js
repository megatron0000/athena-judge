import Express from "express";
import Cors from "cors";

import DB from "./db";
import Api from "./api/api";

import Config from "./config";

const app = Express();

app.use(Cors());

app.use(Express.urlencoded({ extended: true }));
app.use(Express.json());

app.get("/", (req, res) => {
  res.json({ data: "OK" });
});

app.use("/api", Api);

app.use((req, res, next) => {
  res.status(404);
  res.json({ error: "NotFound", message: "Não encontrado" });
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500);
  res.json({ error: "InternalServerError", message: err.message });
});

app.listen(Config.PORT, () => {
  console.log(`Server running at port ${Config.PORT}`);
});

DB.sync();
