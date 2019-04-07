import Express from "express";

import AssignmentsRouter from "./assignments";
import CoursesRouter from "./courses";
import UsersRouter from "./users";
import SubmissionsRouter from "./submissions";

const api = Express.Router();

api.use("/assignments", AssignmentsRouter);
api.use("/courses", CoursesRouter);
api.use("/users", UsersRouter);
api.use("/submissions", SubmissionsRouter);

export default api;