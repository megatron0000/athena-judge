import AssignmentsModel from "./assignments/model";
import SubmissionsModel from "./submissions/model";
import ProfessorsModel from "./professors/model";
import StudentsModel from "./students/model";
import RegistrationsModel from "./registrations/model";
import ClassesModel from "./classes/model";

export default async function sync() {
  await AssignmentsModel.sync({ force: true });
  await SubmissionsModel.sync({ force: true });
  await ProfessorsModel.sync({ force: true });
  await StudentsModel.sync({ force: true });
  await RegistrationsModel.sync({ force: true });
  await ClassesModel.sync({ force: true });
  console.log("Database schema synced");
}