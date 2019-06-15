const Sequelize = require('sequelize')
const { Schema } = require('../schema')

const AssignmentsModel = Schema.define("assignments", {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
  },
  dueDate: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "assignments"
});

module.exports = {
  AssignmentsModel
}