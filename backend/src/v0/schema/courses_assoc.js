const Sequelize = require('sequelize')
const { Schema } = require('../schema')

const CoursesAssocModel = Schema.define("courses_assoc", {
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
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
  tableName: "courses_assoc",
});

module.exports = {
  CoursesAssocModel
}