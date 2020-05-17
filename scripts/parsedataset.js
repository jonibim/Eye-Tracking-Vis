const {v4: uuid} = require('uuid');

const csv2json = require('csvtojson')
const fileSystem = require('fs')

const datasetsFolder = __dirname + '/../public/datasets/';
const defaultFolder = datasetsFolder + 'default/';
const uploadsFolder = datasetsFolder + 'uploads/';

const dataFileName = 'data.json';
const imagesFolderName = 'images/';

// Handle dataset datasets
async function parseData(files, response) {
    console.log('parsedataset.js - Parsing uploaded dataset...');

    let data = files.dataset.data.toString();
    data = data.replace(/\t/g, ',');

    // try to parse the csv data into JSON
    try {
        data = await csv2json().fromString(data);
    } catch (e) {
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is not properly formatted.'});
        console.log('parsedataset.js - Failed to parse uploaded dataset');
        return;
    }

    // check for required fields
    if(!data[0].Timestamp || !data[0].StimuliName || !data[0].FixationIndex || !data[0].FixationDuration || !data[0].MappedFixationPointX || !data[0].MappedFixationPointY || !data[0].user || !data[0].description){
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is missing one of the following fields, \'Timestamp\', \'StimuliName\', \'FixationIndex\', \'FixationDuration\', \'MappedFixationPointX\', \'MappedFixationPointY\', \'user\', \'description\'.'});
        console.log('parsedataset.js - The uploaded dataset is missing fields');
        return;
    }

    // get a list of the images mentioned in the data
    const images = [];
    for(let entry of data)
        if (!images.includes(entry.StimuliName))
            images.push(entry.StimuliName)

    // check if all images are there
    if(images.length && !files.images){
        response.status(400).send({'status': 400, 'message': 'Images for the dataset must be included.'});
        console.log('parsedataset.js - No images found for the uploaded dataset');
        return;
    }
    loop: for(let image of images){
        for(let entry of files.images)
            if(entry.name === image)
                continue loop;
        response.status(400).send({'status': 400, 'message': 'Missing dataset image \'' + image + '\'.'});
        console.log('parsedataset.js - Missing image for the uploaded dataset');
        return;
    }

    // unique id for the uploaded dataset
    let id = uuid();

    // try to write the data and images to the uploads folder
    try {
        let string = JSON.stringify(data, null, 1);
        fileSystem.writeFileSync(uploadsFolder + id + '/' + dataFileName, string, 'utf-8');
        for(let image of files.images)
            fileSystem.writeFileSync(uploadsFolder + id + '/' + imagesFolderName + image.name, image.data);
    } catch (e) {
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is not properly formatted.'});
        console.err('parsedataset.js - Failed to write file to disk');
        console.log(e);
        return;
    }

    console.log('parsedataset.js - Uploaded dataset has been saved with id \'' + id + '\'');

    // send successful response
    response.status(200).send({'status': 200, 'message': 'Upload successful.', 'id': id});
}

// Handle dataset requests   TODO remove this because everything is now in the public folder
function readData(id, response) {
    console.log('parsedataset.js - Loading dataset for id \'' + id + '\'...');

    const file = uploadsFolder + id + '/' + dataFileName;

    if (!fileSystem.existsSync(file)) {
        response.status(400).send({'status': 400, 'message': 'Can\'t find dataset for id \'' + id + '\''});
        console.log('parsedataset.js - Failed to find dataset for id \'' + id + '\'');
        return;
    }

    response.status(200).send(fileSystem.readFileSync(file));

    console.log('parsedataset.js - Send dataset with id \'' + id + '\'');
}


module.exports = {'parseData': parseData, 'readData': readData};
