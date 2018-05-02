import AssignmentsModel from "./assignments/model";

export default async function sync() {
  await AssignmentsModel.sync({ force: true });
  console.log("Database schema synced");
}