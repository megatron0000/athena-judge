import Express from "express";

import AssignmentsRouter from "./assignments/router";
import CoursesRouter from "./courses/router";
import UsersRouter from "./users/router";
import SubmissionsRouter from "./submissions/router";

const router = Express.Router();

router.use("/assignments", AssignmentsRouter);
router.use("/courses", CoursesRouter);
router.use("/users", UsersRouter);
router.use("/submissions", SubmissionsRouter);

export default router;