// all data for the visualizations
class Dataset {

    constructor() {
        this.onload = [];
    }

    importData(data) {
        console.log('dataset.js - Importing data...')
        this.images = [];

        const lines = data.split('\n');

        for (let i = 0; i < lines.length && i < 101; i++) { // limit to 100 for testing
            const line = lines[i];

            if(i % 100 === 0)
                console.log('dataset.js - Reading line ' + (i + 1) + '/' + lines.length);

            if(line.startsWith('Timestamp')) // ignore the first line
                continue;

            let words = [];
            let word = '';
            for(let i2 = 0; i2 < line.length; i2++){
                const char = line.charAt(i2);
                if(char.trim().length === 0){
                    if(word !== '')
                        words.push(word);
                    word = '';
                }
                else
                    word += char;
            }
            if(word !== '')
                words.push(word);

            this.addData(words[1], words[0], words[2], words[3], words[4], words[5], words[6], words[7])
        }

        for(let i = 0; i < this.onload.length; i++)
            if(this.onload[i])
                this.onload[i]();
    }

    addData(image, timestamp, fixationIndex, fixationDuration, pointX, pointY, person, color) {
        // check if there's already data for the image
        for(let i = 0 ; i < this.images.length; i++){
            if(this.images[i].image === image){
                this.images[i].addScanPathPoint(timestamp, fixationIndex, fixationDuration, pointX, pointY, person, color);
                return;
            }
        }

        // create new image data
        const imageData = new ImageData(image);
        this.images.push(imageData);
        imageData.addScanPathPoint(timestamp, fixationIndex, fixationDuration, pointX, pointY, person, color);
    }

    getImages(){
        let images = [];
        for(let i = 0; i < this.images.length; i++)
            images.push(this.images[i].image);
        return images;
    }

    getImageData(image){
        for(let i = 0; i < this.images.length; i++)
            if(this.images[i].image === image)
                return this.images[i];
        return null;
    }
}

class ImageData {

    constructor(image) {
        this.image = image;
        this.scanpaths = [];
    }

    addScanPathPoint(timestamp, fixationIndex, fixationDuration, pointX, pointY, person, color) {
        for (let i = 0; i < this.scanpaths.length; i++) {
            const scanPath = this.scanpaths[i];
            if (scanPath.person === person && scanPath.color === color) {
                scanPath.addPoint(timestamp, fixationIndex, fixationDuration, pointX, pointY);
                return;
            }
        }
        let scanPath = new ScanPath(person, color);
        scanPath.addPoint(timestamp, fixationIndex, fixationDuration, pointX, pointY);
        this.scanpaths.push(scanPath);
    }

    getScanPaths(person, color){
        let scanPaths = [];
        for(let i = 0; i < this.scanpaths.length; i++){
            const scanPath = this.scanpaths[i];
            if((!person || scanPath.person === person) && (!color || scanPath.color === color))
                scanPaths.push(scanPath);
        }
        return scanPaths;
    }

}

class ScanPath {

    constructor(person, color) {
        this.person = person;
        this.color = color;
        this.points = [];
    }

    addPoint(time, fixationIndex, fixationDuration, x, y) {
        this.points.push(new ScanPoint(time, fixationIndex, fixationDuration, x, y));
    }

    getPoint(time){
        for(let i = 0; i < this.points.length; i++){
            if(this.points[i].time === time)
                return this.points[i];
        }
        return null;
    }

    getPoints(){
        return this.points;
    }

}

class ScanPoint {

    constructor(time, fixationIndex, fixationDuration, x, y) {
        this.time = time;
        this.fixationIndex = fixationIndex;
        this.fixationDuration = fixationDuration;
        this.x = x;
        this.y = y;
    }

}