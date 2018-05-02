import Express from "express";

import AssignmentsRouter from "./assignments/router";

const router = Express.Router();

router.use("/assignments", AssignmentsRouter);

export default router;