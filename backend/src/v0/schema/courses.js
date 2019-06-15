const Sequelize = require('sequelize')
const { Schema } = require('../schema')

const CoursesModel = Schema.define("courses", {
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


module.exports = {
  CoursesModel
}