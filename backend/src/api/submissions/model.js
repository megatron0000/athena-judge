import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("submissions", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  studentID: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  assignmentID: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "submissions"
});