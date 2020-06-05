const {v4: uuid} = require('uuid');

const csvToJson = require('./csvtojson.js');
const fileSystem = require('fs');

const datasetsFolder = __dirname + '/../public/datasets/';
const defaultFolder = datasetsFolder + 'default/';
const uploadsFolder = datasetsFolder + 'uploads/';

const dataFileName = 'data.json';
const imagesFolderName = 'images/';

// Handle dataset datasets
async function handleDatasetUpload(files, name, response) {
    console.log('parsedataset.js - Parsing uploaded dataset...');

    // get the file as a string
    let data = files.dataset.data.toString('utf8');
    data = data.replace(/\t/g, ',');

    // try to parse the csv data into JSON
    try {
        data = csvToJson(data);
    } catch (e) {
        response.status(400).send({
            'status': 400,
            'message': 'The uploaded dataset is not properly formatted. ' + e.err
        });
        console.log('parsedataset.js - Failed to parse uploaded dataset');
        return;
    }

    // check for required fields
    if (!data[0].Timestamp || !data[0].StimuliName || !data[0].FixationIndex || !data[0].FixationDuration || !data[0].MappedFixationPointX || !data[0].MappedFixationPointY || !data[0].user || !data[0].description) {
        response.status(400).send({
            'status': 400,
            'message': 'The uploaded dataset is missing one of the following fields, \'Timestamp\', \'StimuliName\', \'FixationIndex\', \'FixationDuration\', \'MappedFixationPointX\', \'MappedFixationPointY\', \'user\', \'description\'.'
        });
        console.log('parsedataset.js - The uploaded dataset is missing fields');
        return;
    }

    // get a list of the images mentioned in the data
    const images = [];
    for (let entry of data)
        if (!images.includes(entry.StimuliName))
            images.push(entry.StimuliName)

    // check if all images are there
    if (images.length && !files.images) {
        response.status(400).send({'status': 400, 'message': 'Images for the dataset must be included.'});
        console.log('parsedataset.js - No images found for the uploaded dataset');
        return;
    }
    if (files.images.name)
        files.images = [files.images]
    loop: for (let image of images) {
        for (let entry of files.images) {
            if (entry.name === image)
                continue loop;
        }

        response.status(400).send({'status': 400, 'message': 'Missing dataset image \'' + image + '\'.'});
        console.log('parsedataset.js - Missing image for the uploaded dataset');
        return;
    }

    // unique id for the uploaded dataset
    let id = uuid();

    // try to write the data and images to the uploads folder
    try {
        // create folder
        fileSystem.mkdirSync(uploadsFolder + id);

        // write info file
        fileSystem.writeFileSync(uploadsFolder + id + '/info.json', JSON.stringify({id: id, name: name}), 'utf-8');

        // write the dataset
        let string = JSON.stringify(data, null, 1);
        fileSystem.writeFileSync(uploadsFolder + id + '/' + dataFileName, string, 'utf-8');

        // write the images
        fileSystem.mkdirSync(uploadsFolder + id + '/' + imagesFolderName);
        for (let image of files.images)
            fileSystem.writeFileSync(uploadsFolder + id + '/' + imagesFolderName + image.name, image.data);
    } catch (e) {
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is not properly formatted.'});
        console.error('parsedataset.js - Failed to write file to disk');
        console.log(e);
        return;
    }

    console.log('parsedataset.js - Uploaded dataset has been saved with id \'' + id + '\'');

    // send successful response
    response.status(200).send({'status': 200, 'message': 'Upload successful.', 'id': id});
}


function getAllDatasets() {
    fileSystem.mkdirSync(uploadsFolder);
    let folders = fileSystem.readdirSync(uploadsFolder, {withFileTypes: true}).filter(file => file.isDirectory()).map(file => uploadsFolder + file.name);
    folders.push(defaultFolder);

    let datasets = [];

    for(let folder of folders){
        if(!fileSystem.existsSync(folder + '/info.json'))
            continue;

        let info = JSON.parse(fileSystem.readFileSync(folder + '/info.json').toString('utf-8'));
        datasets.push(info);
    }

    return datasets;
}


module.exports = {'handleDatasetUpload': handleDatasetUpload, 'getAllDatasets': getAllDatasets};
