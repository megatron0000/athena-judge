const { uploadTeacherCredential } = require('../google-interface/src/cloudstorage')
const { createRegistration } = require('../google-interface/src/classroom')

async function main() {
  await uploadTeacherCredential(
    process.env['CLASSROOM_TEST_COURSE_ID'],
    process.env['OAUTH_USER_TOKEN_FILE']
  )

  await createRegistration(process.env['CLASSROOM_TEST_COURSE_ID'])
}

if (module === require.main) {
  main().then(console.log('Done. Exiting...'))
}