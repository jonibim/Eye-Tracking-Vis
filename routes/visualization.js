const express = require('express');
const router = express.Router();
const fs = require("fs");
const imagePath = __dirname + '/../public/testdataset/images';
let images = fs.readdirSync(imagePath);
let tags = {};
let tagMap = {
   \u00f6:"o",
   \u00fc:"u",
   \u00e4:"a",
   	_:" "
};

images.sort();
for (image of images) {
	let tag = "";
	if (image[2] === 'b') {
		tag += "grey;gray;";
	} else {
		tag += "color;colour;";
	}
	tag += image.replace(/\u00f6|\u00fc|\u00fc|_/gi, function(char){
	  		return tagMap[char];
		})
	tags[image] = tag
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