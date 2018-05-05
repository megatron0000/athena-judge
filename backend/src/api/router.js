import Express from "express";

import AssignmentsRouter from "./assignments/router";
import ClassesRouter from "./classes/router";

const router = Express.Router();

router.use("/assignments", AssignmentsRouter);
router.use("/classes", ClassesRouter);
// router.use("/assignments", AssignmentsRouter);
// router.use("/assignments", AssignmentsRouter);
// router.use("/assignments", AssignmentsRouter);
// router.use("/assignments", AssignmentsRouter);

export default router;