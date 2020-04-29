const {v4: uuid} = require('uuid');

const csv2json = require('csvtojson')
const fileSystem = require('fs')

const uploadFolder = __dirname + '/../uploads/';

async function parseData(file, response) { // filePath is the upload path of the uploaded file
    console.log('parsedataset.js - Parsing uploaded dataset...');

    let data = file.data.toString();
    data = data.replace(/\t/g, ',');

    // unique id for the uploaded dataset
    let id = uuid();

    try {
        let jsonArrayObject = await csv2json().fromString(data);
        let string = JSON.stringify(jsonArrayObject, null, 1);
        fileSystem.writeFileSync(uploadFolder + id + '.json', string, 'utf-8');
    } catch (e) {
        response.status(400).send({'status': 400, 'message': 'The uploaded dataset is not properly formatted.'});
        console.log('parsedataset.js - Failed to parse uploaded dataset');
        console.log(e);
        return;
    }

    console.log('parsedataset.js - Uploaded dataset has been parsed with id \'' + id + '\'');

    response.status(200).send({'status': 200, 'message': 'Upload successful.', 'id': id});
}

function readData(id, response) {
    console.log('parsedataset.js - Loading dataset for id \'' + id + '\'...');

    const file = uploadFolder + id + '.json';

    if (!fileSystem.existsSync(file)) {
        response.status(400).send({'status': 400, 'message': 'Can\'t find dataset for id \'' + id + '\''});
        console.log('parsedataset.js - Failed to find dataset for id \'' + id + '\'');
        return;
    }

    response.status(200).send(fileSystem.readFileSync(file));

    console.log('parsedataset.js - Send dataset with id \'' + id + '\'');
}


module.exports = {'parseData': parseData, 'readData': readData};
