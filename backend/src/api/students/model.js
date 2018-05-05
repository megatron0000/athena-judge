import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("students", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  matriculation: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "students"
});
