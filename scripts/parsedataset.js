const {v4: uuid} = require('uuid');

const csv2json = require('csvtojson')
const fileSystem = require('fs')
const iconv = require('iconv')

const umlautMap = {
    '\u00dc': 'UE',
    '\u00c4': 'AE',
    '\u00d6': 'OE',
    '\u00fc': 'ue',
    '\u00e4': 'ae',
    '\u00f6': 'oe',
    '\u00df': 'ss',
  }

const datasetsFolder = __dirname + '/../public/datasets/';
const defaultFolder = datasetsFolder + 'default/';
const uploadsFolder = datasetsFolder + 'uploads/';

const dataFileName = 'data.json';
const imagesFolderName = 'images/';

// Handle dataset datasets
async function parseData(files, response) {
    console.log('parsedataset.js - Parsing uploaded dataset...');

    // var iconv = new Iconv('UTF-8', 'ISO-8859-1');
    // iconv.convert(files.dataset.data.toString())

    let data = files.dataset.data.toString('binary');
    data = replaceUmlaute(toUTF8(data))
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
    if(files.images.name)
        files.images = [files.images]
    loop: for(let image of images){
        for(let entry of files.images){
            console.log((replaceUmlaute(toUTF8(entry.name))+' '+image))
            if ((replaceUmlaute(toUTF8(entry.name))) === (replaceUmlaute(toUTF8(image))))
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

function toUTF8(body) {
    // convert from iso-8859-1 to utf-8
    var ic = new iconv.Iconv('utf-8','iso-8859-1');
    var buf = ic.convert(body);
    return buf.toString('binary');
  }

  function replaceUmlaute(str) {
    return str
      .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
        const big = umlautMap[a.slice(0, 1)];
        return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
      })
      .replace(new RegExp('['+Object.keys(umlautMap).join('|')+']',"g"),
        (a) => umlautMap[a]
      );
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
