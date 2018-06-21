import Sequelize from "sequelize";

const Schema = new Sequelize("athena", "athena", "athena", {
  host: "localhost",
  dialect: "postgres"
});

export default Schema;