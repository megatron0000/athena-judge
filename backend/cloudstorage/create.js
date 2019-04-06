// Imports the Google Cloud client library
require('../credentials/config')
const {Storage} = require('@google-cloud/storage');
 

const credentialsPath = '../credentials/' + process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_CREDENTIALS'];

console.log("Env = ", credentialsPath);

// Creates a client
const storage = new Storage({
  projectId: 'ces29-athena',
  keyFilename: credentialsPath
}); 

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const bucketName = 'bucket-name-athena-test';

async function createBucket() {
  // Creates the new bucket
  await storage.createBucket(bucketName);
  console.log(`Bucket ${bucketName} created.`);
}

createBucket();