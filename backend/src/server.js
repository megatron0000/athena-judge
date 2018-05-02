import Express from "express";
import Cors from "cors";

import ApiSchema from "./api/schema";
import ApiRouter from "./api/router";

import { PORT } from "./config";

const app = Express();

app.use(Cors());

app.use(Express.urlencoded({ extended: true }));
app.use(Express.json());

app.get("/", (req, res) => {
  res.json({ data: "OK" });
});

app.use("/api", ApiRouter);

app.use((req, res, next) => {
  res.status(404);
  res.json({ error: "NotFound", message: "Não encontrado" });
});

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500);
  res.json({ error: "InternalServerError", message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});

ApiSchema();
