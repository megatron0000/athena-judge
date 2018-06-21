import AssignmentsModel from "./api/assignments/model";
import AssignmentsTestsModel from "./api/assignments_tests/model";
import CoursesModel from "./api/courses/model";
import CoursesAssocModel from "./api/courses_assoc/model";
import SubmissionsModel from "./api/submissions/model";
import UsersModel from "./api/users/model";

export default class DB {}

DB.assignments = AssignmentsModel;
DB.assignments_tests = AssignmentsTestsModel;
DB.courses = CoursesModel;
DB.courses_assoc = CoursesAssocModel;
DB.submissions = SubmissionsModel;
DB.users = UsersModel;