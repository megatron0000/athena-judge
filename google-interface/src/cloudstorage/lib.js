require('../credentials/config')

const fs = require('promise-fs')
const path = require('path')
const { mkdir } = require('mkdir-recursive')

// Imports the Google Cloud client library.
const { Storage } = require('@google-cloud/storage');

// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md

// Creates a client
const storage = new Storage({
  projectId: process.env['GOOGLE_PROJECT_ID'],
  keyFilename: process.env['CLOUDSTORAGE_HANDLER_SERVICEACCOUNT_CREDENTIALS']
});

const bucket = storage.bucket(process.env['CLOUDSTORAGE_BUCKET_NAME'])

'use strict';

function listFiles() {
  // Lists files in the bucket
  return bucket.getFiles();

}

async function listFilesByPrefix(prefix) {

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
    prefix: prefix
  };

  // Lists files in the bucket, filtered by a prefix
  const [files] = await bucket.getFiles(options)
  return files.map(file => file.name);
}

function uploadFile(localFilename, destinationPath) {

  // Uploads a local file to the bucket
  return bucket.upload(localFilename, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: false,
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

  // console.log(`${localFilename} uploaded to ${bucket.name}.`);
  // [END storage_upload_file]
}

async function downloadFile(srcFilename, destFilename) {

  return new Promise((resolve, reject) => {
    mkdir(path.dirname(destFilename), err => {
      if (err) reject(err)

      const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: destFilename,
        gzip: false
      };

      // Downloads the file
      bucket.file(srcFilename).download(options).then(resolve)
    })
  })


  // [END storage_download_file]
}

function deleteFile(filename) {

  // Deletes the file from the bucket
  return bucket.file(filename).delete();

  // [END storage_delete_file]
}

/**
 *
 * @param {string[]} filenames
 */
function deleteFiles(filenames) {
  return Promise.all(filenames.map(deleteFile))
}

async function getMetadata(filename) {

  // Gets the metadata for the file
  const [metadata] = await bucket.file(filename).getMetadata();

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

  // Makes the file public
  await bucket.file(filename).makePublic();

  console.log(`gs://${bucket.name}/${filename} is now public.`);
  // [END storage_make_public]
}

async function moveFile(srcFilename, destFilename) {

  // Moves the file within the bucket
  await bucket.file(srcFilename).move(destFilename);

  console.log(
    `gs://${bucket.name}/${srcFilename} moved to gs://${bucket.name}/${destFilename}.`
  );
  // [END storage_move_file]
}

async function copyFile(
  srcBucketName,
  srcFilename,
  destBucketName,
  destFilename
) {

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
exports.deleteFiles = deleteFiles
exports.getMetadata = getMetadata;
exports.makePublic = makePublic;
exports.moveFile = moveFile;
exports.copyFile = copyFile;
