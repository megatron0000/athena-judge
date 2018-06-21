import Sequelize from "sequelize";
import Schema from "../schema";

export default Schema.define("courses", {
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
