const GCS = require('./lib.js'); // GCS = Google Cloud Storage
const fs = require('fs');
const path = require('path');

const allFilesSync = (dir, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)

        fileList.push(
            fs.statSync(filePath).isDirectory()
                ? {[file]: allFilesSync(filePath)}
                : file
        )
    })
    return fileList
}

async function submitStudentDirectory(directory) {
    filesList = allFilesSync(directory);
    console.log(filesList);
    // GCS.uploadFile(directory, "destinationPath");
    // GCS.listFiles();
}


submitStudentDirectory('../cloudstorage');
