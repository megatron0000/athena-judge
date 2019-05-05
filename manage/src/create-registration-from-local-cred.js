const { uploadTeacherCredential } = require('./google-interface/cloudstorage')
const { createRegistration } = require('./google-interface/classroom')

async function main() {
  await uploadTeacherCredential(
    process.env['CLASSROOM_TEST_COURSE_ID'],
    process.env['CLASSROOM_TEST_COURSE_TEACHER_OAUTH_TOKEN_FILE']
  )

  await createRegistration(process.env['CLASSROOM_TEST_COURSE_ID'])
}

if (module === require.main) {
  main().then(console.log('Done. Exiting...'))
}