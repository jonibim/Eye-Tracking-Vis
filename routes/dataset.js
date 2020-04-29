const express = require('express');
const router = express.Router();

const readFile = require('../scripts/parsedataset');

// handle upload
router.post('/upload', function(req, res, next) {
    // handle upload here
    // respond with dataset id
});

// handle request
router.post('/request', function(req, res, next) {
    // send the dataset corresponding to the requested id
});


module.exports = router;
