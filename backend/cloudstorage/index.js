require('../credentials/config')

// Imports the Google Cloud client library.
const {Storage} = require('@google-cloud/storage');

// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
const credentialsPath = '../credentials/' + process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_CREDENTIALS'];
const bucketName = 'bucket-name-athena-test';

// Creates a client
const storage = new Storage({
  projectId: 'ces29-athena',
  keyFilename: credentialsPath
}); 

'use strict';

async function listFiles() {
  /**
   * TODO(developer): Uncomment the following line before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';

  // Lists files in the bucket
  const [files] = await storage.bucket(bucketName).getFiles();

  console.log('Files:');
  files.forEach(file => {
    console.log(file.name);
  });
  // [END storage_list_files]
}

async function listFilesByPrefix(prefix, delimiter) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const prefix = 'Prefix by which to filter, e.g. public/';
  // const delimiter = 'Delimiter to use, e.g. /';

  /**
   * This can be used to list all blobs in a "folder", e.g. "public/".
   *
   * The delimiter argument can be used to restrict the results to only the
   * "files" in the given "folder". Without the delimiter, the entire tree under
   * the prefix is returned. For example, given these blobs:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * If you just specify prefix = '/a', you'll get back:
   *
   *   /a/1.txt
   *   /a/b/2.txt
   *
   * However, if you specify prefix='/a' and delimiter='/', you'll get back:
   *
   *   /a/1.txt
   */
  const options = {
    prefix: prefix,
  };

  if (delimiter) {
    options.delimiter = delimiter;
  }

  // Lists files in the bucket, filtered by a prefix
  const [files] = await storage.bucket().getFiles(options);

  console.log('Files:');
  files.forEach(file => {
    console.log(file.name);
  });
  // [END storage_list_files_with_prefix]
}

async function uploadFile(localFilename, destinationPath) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

  // Uploads a local file to the bucket
  await storage.bucket(bucketName).upload(localFilename, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    destination: destinationPath,
    // By setting the option `destination`, you can change the name of the
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: 'public, max-age=31536000',
    },
  });

  console.log(`${localFilename} uploaded to ${bucketName}.`);
  // [END storage_upload_file]
}

async function downloadFile(srcFilename, destFilename) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const srcFilename = 'Remote file to download, e.g. file.txt';
  // const destFilename = 'Local destination for file, e.g. ./local/path/to/file.txt';

  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: destFilename,
  };

  // Downloads the file
  await storage
    .bucket(bucketName)
    .file(srcFilename)
    .download(options);

  console.log(
    `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
  );
  // [END storage_download_file]
}

async function deleteFile(filename) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const filename = 'File to delete, e.g. file.txt';

  // Deletes the file from the bucket
  await storage
    .bucket(bucketName)
    .file(filename)
    .delete();

  console.log(`gs://${bucketName}/${filename} deleted.`);
  // [END storage_delete_file]
}

async function getMetadata(filename) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const filename = 'File to access, e.g. file.txt';

  // Gets the metadata for the file
  const [metadata] = await storage
    .bucket(bucketName)
    .file(filename)
    .getMetadata();

  console.log(`File: ${metadata.name}`);
  console.log(`Bucket: ${metadata.bucket}`);
  console.log(`Storage class: ${metadata.storageClass}`);
  console.log(`Self link: ${metadata.selfLink}`);
  console.log(`ID: ${metadata.id}`);
  console.log(`Size: ${metadata.size}`);
  console.log(`Updated: ${metadata.updated}`);
  console.log(`Generation: ${metadata.generation}`);
  console.log(`Metageneration: ${metadata.metageneration}`);
  console.log(`Etag: ${metadata.etag}`);
  console.log(`Owner: ${metadata.owner}`);
  console.log(`Component count: ${metadata.component_count}`);
  console.log(`Crc32c: ${metadata.crc32c}`);
  console.log(`md5Hash: ${metadata.md5Hash}`);
  console.log(`Cache-control: ${metadata.cacheControl}`);
  console.log(`Content-type: ${metadata.contentType}`);
  console.log(`Content-disposition: ${metadata.contentDisposition}`);
  console.log(`Content-encoding: ${metadata.contentEncoding}`);
  console.log(`Content-language: ${metadata.contentLanguage}`);
  console.log(`Media link: ${metadata.mediaLink}`);
  console.log(`KMS Key Name: ${metadata.kmsKeyName}`);
  console.log(`Temporary Hold: ${metadata.temporaryHold}`);
  console.log(`Event-based hold: ${metadata.eventBasedHold}`);
  console.log(`Effective Expiration Time: ${metadata.effectiveExpirationTime}`);
  console.log(`Metadata: ${metadata.metadata}`);
  // [END storage_get_metadata]
}

async function makePublic(filename) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const filename = 'File to make public, e.g. file.txt';

  // Makes the file public
  await storage
    .bucket(bucketName)
    .file(filename)
    .makePublic();

  console.log(`gs://${bucketName}/${filename} is now public.`);
  // [END storage_make_public]
}

async function moveFile(srcFilename, destFilename) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const bucketName = 'Name of a bucket, e.g. my-bucket';
  // const srcFilename = 'File to move, e.g. file.txt';
  // const destFilename = 'Destination for file, e.g. moved.txt';

  // Moves the file within the bucket
  await storage
    .bucket(bucketName)
    .file(srcFilename)
    .move(destFilename);

  console.log(
    `gs://${bucketName}/${srcFilename} moved to gs://${bucketName}/${destFilename}.`
  );
  // [END storage_move_file]
}

async function copyFile(
  srcBucketName,
  srcFilename,
  destBucketName,
  destFilename
) {
  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const srcBucketName = 'Name of the source bucket, e.g. my-bucket';
  // const srcFilename = 'Name of the source file, e.g. file.txt';
  // const destBucketName = 'Name of the destination bucket, e.g. my-other-bucket';
  // const destFilename = 'Destination name of file, e.g. file.txt';

  // Copies the file to the other bucket
  await storage
    .bucket(srcBucketName)
    .file(srcFilename)
    .copy(storage.bucket(destBucketName).file(destFilename));

  console.log(
    `gs://${srcBucketName}/${srcFilename} copied to gs://${destBucketName}/${destFilename}.`
  );
  // [END storage_copy_file]
}

exports.listFiles = listFiles;
exports.listFilesByPrefix = listFilesByPrefix;
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.deleteFile = deleteFile;
exports.getMetadata = getMetadata;
exports.makePublic = makePublic;
exports.moveFile = moveFile;
exports.copyFile = copyFile;
