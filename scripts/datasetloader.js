const {v4: uuid} = require('uuid');

const fileSystem = require('fs');
const csvToJson = require('./csvtojson');
const getDirSize = require('./getdirsize');
const removeDir = require('./removedir');

const uploadsSizeLimit = 10 * 1024 * 1024 * 1024; // 10 GB

const datasetsFolder = __dirname + '/../public/datasets/';
const defaultFolder = datasetsFolder + 'default/';
const uploadsFolder = datasetsFolder + 'uploads/';

const dataFileName = 'data.json';
const imagesFolderName = 'images/';

/**
 * Handle dataset datasets
 * @param files - the uploaded files
 * @param {string} name - name of the dataset
 * @param {boolean} unlisted - whether the dataset is private
 * @param response - the http response
 * @return {Promise<void>}
 */
async function handleDatasetUpload(files, name, unlisted, response) {
    console.log('datasetloader.js - Parsing uploaded dataset...');

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
        console.log('datasetloader.js - Failed to parse uploaded dataset');
        return;
    }

    // check for required fields
    if (!data[0].Timestamp || !data[0].StimuliName || !data[0].FixationIndex || !data[0].FixationDuration || !data[0].MappedFixationPointX || !data[0].MappedFixationPointY || !data[0].user || !data[0].description) {
        response.status(400).send({
            'status': 400,
            'message': 'The uploaded dataset is missing one of the following fields, \'Timestamp\', \'StimuliName\', \'FixationIndex\', \'FixationDuration\', \'MappedFixationPointX\', \'MappedFixationPointY\', \'user\', \'description\'.'
        });
        console.log('datasetloader.js - The uploaded dataset is missing fields');
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
        console.log('datasetloader.js - No images found for the uploaded dataset');
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
        console.log('datasetloader.js - Missing image for the uploaded dataset');
        return;
    }

    // unique id for the uploaded dataset
    let id = uuid();

    // try to write the data and images to the uploads folder
    try {
        // create folder
        fileSystem.mkdirSync(uploadsFolder + id);

        // write info file
        fileSystem.writeFileSync(uploadsFolder + id + '/info.json', JSON.stringify({id: id, name: name, private: unlisted, date: Date.now()}), 'utf-8');

        // write the dataset
        let string = JSON.stringify(data, null, 1);
        fileSystem.writeFileSync(uploadsFolder + id + '/' + dataFileName, string, 'utf-8');

        // write the images
        fileSystem.mkdirSync(uploadsFolder + id + '/' + imagesFolderName);
        for (let image of files.images)
            fileSystem.writeFileSync(uploadsFolder + id + '/' + imagesFolderName + image.name, image.data);
    } catch (e) {
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is not properly formatted.'});
        console.error('datasetloader.js - Failed to write file to disk');
        console.log(e);
        return;
    }

    console.log('datasetloader.js - Uploaded dataset has been saved with id \'' + id + '\'');

    // send successful response
    response.status(200).send({'status': 200, 'message': 'Upload successful.', 'id': id});

    setTimeout(ensureDiskSpace, 0);
}


/**
 * @return {{id: string, name: string, [private]: boolean, [date]: number}[]} info for all the datasets
 */
function getAllDatasets() {
    if(!fileSystem.existsSync(uploadsFolder))
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


/**
 * Updates the last requested date in the datasets info file
 * @param {string} id - id of the dataset
 * @param response - the http response
 */
function updateDate(id, response){
    if(!fileSystem.existsSync(uploadsFolder + id))
        return response.status(400).send({'status': 400, 'message': 'There is no dataset with id \'' + id + '\'.'});

    if(!fileSystem.existsSync(uploadsFolder + id + '/info.json')) {
        console.error('Dataset with id \'' + id + '\' is missing an \'info.json\' file');
        return response.status(500).send({'status': 500, 'message': 'Dataset with id \'' + id + '\' is missing an \'info.json\' file.'});
    }

    let info = JSON.parse(fileSystem.readFileSync(uploadsFolder + id + '/info.json').toString('utf-8'));
    info.date = Date.now();

    try {
        fileSystem.writeFileSync(uploadsFolder + id + '/info.json', JSON.stringify(info), 'utf-8');
    } catch (e) {
        response.status(500).send({'status': 500, 'message': 'Error writing file to disk.'});
        console.error('datasetloader.js - Failed to write file to disk');
        console.log(e);
        return;
    }

    response.status(200).send({'status': 200, 'message': 'The date for \'' + id + '\' has been updated.'});
}


/**
 * Makes sure the uploaded datasets don't exceed the set disk space limit. If they do, the longest not used datasets will be removed.
 */
async function ensureDiskSpace(){
    let size = await getDirSize(uploadsFolder);

    if(size <= uploadsSizeLimit){
        console.log('datasetloader.js - Uploads folder size is at ' + (size < 1024 ? size + ' bytes' : size < Math.pow(1024, 2) ? (size / 1024) + ' KB' : size < Math.pow(1024, 3) ? (size / Math.pow(1024, 2)) + ' MB' :  (size / Math.pow(1024, 3)) + ' GB'));
        return;
    }

    let datasets = getAllDatasets();
    // sort the datasets by date
    datasets = datasets.filter(dataset => !!dataset.date).sort(((a, b) => a.date < b.date ? -1 : a.date === b.date ? 0 : 1));

    let removed = [];

    for(let dataset of datasets){
        size -= await getDirSize(uploadsFolder + dataset.id);
        removed.push(dataset);

        if(size <= uploadsSizeLimit)
            break;
    }

    console.log('datasetloader.js - Uploads folder size exceeds its limits, removing ' + removed.length + (removed.length === 1 ? ' dataset' : ' datasets'));

    for(let dataset of removed)
        await removeDir(uploadsFolder + dataset.id);
}


module.exports = {'handleDatasetUpload': handleDatasetUpload, 'getAllDatasets': getAllDatasets, 'updateDate': updateDate};
