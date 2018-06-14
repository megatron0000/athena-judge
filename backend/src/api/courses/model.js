import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("courses", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  creatorUserGid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "courses"
});
