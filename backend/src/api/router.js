import Express from "express";
import Multer from "multer";
import FileSystem from "fs";
import Path from "path";

import AssignmentsRouter from "./assignments/router";
import CoursesRouter from "./courses/router";
import UsersRouter from "./users/router";
import SubmissionsRouter from "./submissions/router";

import CoursesModel from "./courses/model";
import UsersModel from "./users/model";

import { UPLOADS_DIR } from "../config";

const upload = Multer();
const router = Express.Router();

router.use("/assignments", AssignmentsRouter);
router.use("/courses", CoursesRouter);
router.use("/users", UsersRouter);
router.use("/submissions", SubmissionsRouter);

export default router;