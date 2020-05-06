const express = require('express');
const router = express.Router();
const fs = require("fs");
const imagePath = __dirname + '/../public/testdataset/images';
let images = fs.readdirSync(imagePath);
let tags = {};

images.sort();
for (image in images) {
	let tag = "";
	if (images[image][2] == 'b') {
		tag += "grey;gray;";
	} else {
		tag += "color;colour;";
	}
	console.log(images[image], tag)
	tags[images[image]] = tag
};

// Send visualization page.
router.get('/', function(req, res, next) {	
	res.render('visualization', { title: 'Eye Tracking Visualization', images, tags});
});

// Send test dataset.
router.post('/', function(req, res, next) {
    fs.readFile(__dirname + '/../public/testdataset/all_fixation_data_cleaned_up.csv', (err,data) => {
        if(err)
            return console.log(err);
        res.send(data)
    })
});

module.exports = router;