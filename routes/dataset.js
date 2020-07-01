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

    let unlisted = req.body.unlisted === true || req.body.unlisted === 'true' || req.body.unlisted === 'on';

        // Generate and save a dataset from the uploaded files
    datasetloader.handleDatasetUpload(req.files, req.body.name, unlisted, res);
});

// handle request
router.get('/available', function (req, res, next) {
    let datasets = datasetloader.getAllDatasets();
    datasets = datasets.filter(dataset => !dataset.private || (req.query && dataset.id === req.query.id));

    res.status(200).send(datasets);
});

// update last request date
router.post('/date', function (req, res, next) {
    if(!req.query.id)
        return res.status(400).send({'status': 400, 'message': 'Request body must contain an id.'});

    // the default dataset doesn't need to be updated, because it won't ever be deleted
    if(req.query.id === 'default')
        return res.status(200).send({'status': 200, 'message': 'The date for \'default\' has been updated.'});

    datasetloader.updateDate(req.query.id, res);
});


module.exports = router;
