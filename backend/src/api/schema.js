import AssignmentsModel from "./assignments/model";
import SubmissionsModel from "./submissions/model";
import CoursesModel from "./courses/model";
import CoursesAssocModel from "./courses_assoc/model";
import UsersModel from "./users/model";

export default async function sync() {
  CoursesModel.hasMany(CoursesAssocModel, {
    foreignKey: "courseId",
    sourceKey: "id"
  });
  UsersModel.hasMany(CoursesAssocModel, {
    foreignKey: "userGid",
    sourceKey: "gid"
  });

  await AssignmentsModel.sync({ force: true });
  await SubmissionsModel.sync({ force: true });
  await CoursesModel.sync({ force: true });
  await CoursesAssocModel.sync({ force: true });
  await UsersModel.sync({ force: true });
  console.log("Database schema synced");
}