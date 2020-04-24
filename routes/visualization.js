const express = require('express');
const router = express.Router();

// Send visualization page.
router.get('/', function(req, res, next) {
    res.render('visualization');
});

// Send test dataset.
router.post('/', function(req, res, next) {
    require('fs').readFile(__dirname + '/../public/testdataset/all_fixation_data_cleaned_up.csv', (err,data) => {
        if(err)
            return console.log(err);
        res.send(data)
    })
});

module.exports = router;