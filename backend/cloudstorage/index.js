const GCS = require('./lib.js'); // GCS = Google Cloud Storage
const fs = require('fs');
const path = require('path');

const allFilesSync = (dir, fileList = []) => {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file)

    if (fs.statSync(filePath).isDirectory()) {
      allFilesSync(filePath).forEach(children => {
        fileList.push(path.join(file, children));
      });
    } else {
      fileList.push(file);
    }
  })
  return fileList
}


/**
 * 
 * @param {*} courseId google-id
 * @param {*} courseWorkId google-id
 * @param {*} submissionId google-id
 * @param {*} localDirectory  path of the directory containing the student's submission files
 */
async function submitStudentDirectory(courseId, courseWorkId, submissionId, localDirectory) {
  const cloudDirectory = path.posix.join(courseId, courseWorkId, submissionId);
  files = allFilesSync(localDirectory);

  files.forEach(file => {
    GCS.uploadFile(file, path.posix.join(cloudDirectory, file));
  });
}

/**
 * 
 * @param {string} courseId google-id
 * @param {string} courseWorkId google-id
 * @param {string[]} files Local path of files submitted by teacher
 */
async function submitTeacherFiles(courseId, courseWorkId, files) {
  // files is a string of files containing the submission tests files of the professor
  const cloudDirectory = path.posix.join(courseId, courseWorkId, "testFiles");

  files.forEach(file => {
    GCS.uploadFile(file, path.posix.join(cloudDirectory, file));
  });
}


// GCS.listFiles();

// submitStudentDirectory('123', 'courseWorkIdddd', 'minhaSubmissao' , '../cloudstorage');


// GCS.listFiles();
// GCS.listFilesByPrefix('aaa/', '/');

