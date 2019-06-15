const Sequelize = require('sequelize')
const { Schema } = require('../schema')

const UsersModel = Schema.define("users", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  gid: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  photo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "users"
});


module.exports = {
  UsersModel
}