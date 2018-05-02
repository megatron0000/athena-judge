import Sequelize from "sequelize";

export const DB = new Sequelize("athena", "postgres", "root", {
  host: "localhost",
  dialect: "postgres"
});

export const PORT = 3000;