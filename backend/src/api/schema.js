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

  // MOCK DATA
  // Users generated at https://randomuser.me/
  UsersModel.create({
    gid: "1",
    name: "Professor Paul",
    photo: "https://randomuser.me/api/portraits/men/3.jpg",
    email: "professor.paul@example.com",
  });
  UsersModel.create({
    gid: "2",
    name: "Student Steve",
    photo: "https://randomuser.me/api/portraits/men/1.jpg",
    email: "student.steve@example.com",
  });
  UsersModel.create({
    gid: "3",
    name: "Student Stephany",
    photo: "https://randomuser.me/api/portraits/women/1.jpg",
    email: "student.stephany@example.com",
  });
  UsersModel.create({
    gid: "117441890382622508131",
    name: "Student Placeholder",
    photo: "https://randomuser.me/api/portraits/men/2.jpg",
    email: "student.placeholder@example.com",
  });

  CoursesModel.create({
    creatorUserGid: "1",
    name: "CS-101",
    description: "Introduction to Computer Science",
  });

  AssignmentsModel.create({
    courseId: 1,
    title: "Lab 1 - Printf",
    description: "Create a program that prints a message to the user.",
  });
  AssignmentsModel.create({
    courseId: 1,
    title: "Lab 2 - Temperature Conversor",
    description: "Create a program that converts temperature between the Celsus and Fahrenheit scales.",
  });

  CoursesAssocModel.create({
    courseId: 1,
    userGid: "1",
    role: "professor",
  });
  CoursesAssocModel.create({
    courseId: 1,
    userGid: "2",
    role: "student",
  });
  CoursesAssocModel.create({
    courseId: 1,
    userGid: "3",
    role: "student",
  });
  CoursesAssocModel.create({
    courseId: 1,
    userGid: "117441890382622508131",
    role: "student",
  });
}