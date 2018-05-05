import Sequelize from "sequelize";

import { DB } from "../../config";

export default DB.define("registrations", {
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
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  class: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "registrations"
});
