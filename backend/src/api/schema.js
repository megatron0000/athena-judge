import AssignmentsModel from "./assignments/model";
import SubmissionsModel from "./submissions/model";
import RegistrationsModel from "./registrations/model";
import ClassesModel from "./classes/model";
import UsersModel from "./users/model";

export default async function sync() {
  await AssignmentsModel.sync({ force: true });
  await SubmissionsModel.sync({ force: true });
  await ClassesModel.sync({ force: true });
  await RegistrationsModel.sync({ force: true });
  await UsersModel.sync({ force: true });
  console.log("Database schema synced");
}