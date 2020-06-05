const express = require('express');
const router = express.Router();

const datasetloader = require('../scripts/datasetloader');

// handle upload
router.post('/upload', function (req, res, next) {
    if (!req.body.name || !req.body.name.trim())
        return res.status(400).send({'status': 400, 'message': 'No valid name was entered.'});
    if (!req.files || !req.files.dataset)
        return res.status(400).send({'status': 400, 'message': 'No datasets were uploaded.'});
    if (req.files.length > 1)
        return res.status(400).send({'status': 400, 'message': 'Only one file can be uploaded at a time.'});
    if (!req.files.dataset.name.endsWith('.csv'))
        return res.status(400).send({'status': 400, 'message': 'The dataset file format must be csv.'});

    // Generate json-file from the uploaded csv-file
    datasetloader.handleDatasetUpload(req.files, req.body.name, res);
});

// handle request
router.get('/available', function (req, res, next) {
    let datasets;
    try {
        datasets = datasetloader.getAllDatasets();
    } catch (error){
        console.error(error);
    }

    res.status(200).send(datasets);
});


module.exports = router;
