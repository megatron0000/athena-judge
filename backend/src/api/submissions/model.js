import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("submissions", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  studentGID: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  assignmentID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  studentEmail: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  studentName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  courseId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  code: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "submissions"
});