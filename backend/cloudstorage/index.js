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
    const cloudDirectory = path.posix.join(courseId, courseWorkId, submissionId) + '/';
    filesList = allFilesSync(localDirectory);

    filesList.forEach(file => {
        GCS.uploadFile(file, path.posix.join(cloudDirectory, file));
    });
}

async function submitProfessorDirectory(courseId, courseWorkId, submissionId, localDirectory) {
    const cloudDirectory = path.posix.join(courseId, courseWorkId, submissionId) + '/';
    filesList = allFilesSync(localDirectory);

    filesList.forEach(file => {
        GCS.uploadFile(file, path.posix.join(cloudDirectory, file));
    });
}

filesList = allFilesSync('../cloudstorage');
console.log(filesList)

// GCS.listFiles();

// submitStudentDirectory('123', 'courseWorkIdddd', 'minhaSubmissao' , '../cloudstorage');


// GCS.listFiles();
// GCS.listFilesByPrefix('aaa/', '/');

