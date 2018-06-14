import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("courses_assoc", {
  courseId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  userGid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.ENUM("professor", "student"),
    allowNull: false
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "courses_assoc",
});