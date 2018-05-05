import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("classes", {
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
  professorID: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "classes"
});
