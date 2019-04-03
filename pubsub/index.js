const { Authenticate } = require("./auth")
const { listCourses } = require("./samples")


Authenticate().then(auth => {
  listCourses(auth)
})