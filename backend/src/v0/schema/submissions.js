const Sequelize = require('sequelize')
const { Schema } = require('../schema')

const SubmissionsModel = Schema.define("submissions", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  studentUserGid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  assignmentId: {
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

module.exports = {
  SubmissionsModel
}