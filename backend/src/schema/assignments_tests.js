import Sequelize from "sequelize";
import Schema from "../schema";

export default Schema.define("assignments_tests", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  assignmentId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM("public", "private"),
    allowNull: false,
  },
  input: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  output: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "assignments_tests",
});