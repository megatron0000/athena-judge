const GCS = require('./lib.js'); // GCS = Google Cloud Storage
const fs = require('fs');
const path = require('path');

const allFilesSync = (dir, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        
        if(fs.statSync(filePath).isDirectory()) {
            allFilesSync(filePath).forEach(children => {
                fileList.push(path.join(file, children));
            });
        } else {
            fileList.push(file);
        }
    })
    return fileList
}


async function submitStudentDirectory(courseId, courseWorkId, submissionId, localDirectory) {
    // Local directory is the path of the directory of the students submission
    const cloudDirectory = path.posix.join(courseId, courseWorkId, submissionId);
    files = allFilesSync(localDirectory);

    files.forEach(file => {
        GCS.uploadFile(file, path.posix.join(cloudDirectory, file));
    });
}

async function submitProfessorFiles(courseId, courseWorkId, files) {
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

