const GCS = require('./lib.js'); // GCS = Google Cloud Storage
const fs = require('fs');
const path = require('path');

const getFiles = (dir) => {
    const files = allFilesSync(dir);

}

const allFilesSync = (dir, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        
        if(fs.statSync(filePath).isDirectory()) {
            allFilesSync(filePath).forEach(children => {
                fileList.push(file + '/' + children);
            });
        } else {
            fileList.push(file);
        }
    })
    return fileList
}

async function submitStudentDirectory(directory) {
    filesList = allFilesSync(directory);
    console.log(filesList);

    // filesList.forEach(file => {
    //     let directory = '';
    //     if(file instanceof Map) {
    //         directory += file;
    //         const dir = file;
    //         dir.forEach(file => {
                
    //         });
    //     }
    //     const filePath = path.join(directory, file);
    //     console.log("FilePath = ", filePath);
    //     GCS.uploadFile(filePath, filePath);
    // });

    GCS.listFiles();
}


submitStudentDirectory('../cloudstorage');
