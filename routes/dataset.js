const express = require('express');
const router = express.Router();

const parseDataset = require('../scripts/parsedataset');

// handle upload
router.post('/upload', function (req, res, next) {
    if (!req.files || !req.files.dataset)
        return res.status(400).send({'status': 400, 'message': 'No datasets were uploaded.'});
    if (req.files.length > 1)
        return res.status(400).send({'status': 400, 'message': 'Only one file can be uploaded at a time.'});
    if (!req.files.dataset.name.endsWith('.csv'))
        return res.status(400).send({'status': 400, 'message': 'The dataset file format must be csv.'});

    // Generate json-file from the uploaded csv-file
    parseDataset.parseData(req.files.dataset, res);
});

// handle request
router.post('/request', function (req, res, next) {
    if(!req.query || !req.query.id)
        return res.status(400).send({'status': 400, 'message': 'Missing variable \'id\'.'});

    // Read data from the corresponding file in the uploads folder
    parseDataset.readData(req.query.id, res);
});


module.exports = router;
