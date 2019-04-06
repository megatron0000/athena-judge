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

async function submitStudentDirectory(localDirectory) {
    const cloudDirectory = 'aaa/bb/';
    filesList = allFilesSync(localDirectory);

    filesList.forEach(file => {
        GCS.uploadFile(file, cloudDirectory+file);
    });
}

// GCS.listFiles();

// submitStudentDirectory('../cloudstorage');


// GCS.listFiles();
// GCS.listFilesByPrefix('aaa/', '/');
