/**
 * Loads and stores a dataset
 * @property {boolean} isLoaded - whether a dataset is loaded
 * @property {function[]} onload - listeners for when a dataset is loaded
 * @property {ImageData[]} images - stores the data of all images in the dataset
 * @property name - name of the loaded dataset
 */
class Dataset {

    constructor() {
        this.isLoaded = false;
        this.onload = [];
    }

    /**
     * Imports the data from the given string
     * @param {string} data - the data to be imported
     */
    importData(data) {
        console.log('dataset.js - Importing data...')
        this.images = [];

        this.name = 'Test Data Set'; // TODO add proper dataset name

        const lines = data.split('\n');

        for (let i = 1; i < lines.length; i++) { // ignore the first line
            const line = lines[i];

            // if(i % 1000 === 0)
            //     console.log('dataset.js - Reading line ' + (i + 1) + '/' + lines.length);

            let words = [];
            let word = '';
            for (let i2 = 0; i2 < line.length; i2++) {
                const char = line.charAt(i2);
                if (char.trim().length === 0) {
                    if (word !== '')
                        words.push(word);
                    word = '';
                } else
                    word += char;
            }
            if (word !== '')
                words.push(word);

            this.addData(words[1], words[0], words[2], words[3], words[4], words[5], words[6], words[7])
        }

        this.isLoaded = true;
        for (let i = 0; i < this.onload.length; i++)
            if (this.onload[i])
                this.onload[i]();
    }

    /**
     * Adds a line of data
     * @param {string} image
     * @param {string} timestamp
     * @param {string} fixationIndex
     * @param {string} fixationDuration
     * @param {string} pointX
     * @param {string} pointY
     * @param {string} person
     * @param {string} color
     */
    addData(image, timestamp, fixationIndex, fixationDuration, pointX, pointY, person, color) {
        let imageData;

        // check if there's already data for the image
        for (let i = 0; i < this.images.length; i++)
            if (this.images[i].image === image) {
                imageData = this.images[i];
            }

        // create new image data
        if (!imageData) {
            imageData = new ImageData(image);
            this.images.push(imageData);
        }

        imageData.addScanPathPoint(parseInt(timestamp), parseInt(fixationIndex), parseInt(fixationDuration),
            parseFloat(pointX), parseFloat(pointY), person, color === 'true' || color === '1'); // TODO handle exceptions
    }

    /**
     * @return {string[]} list of the names all images
     */
    getImages() {
        let images = [];
        for (let i = 0; i < this.images.length; i++)
            images.push(this.images[i].image);
        return images;
    }

    /**
     * Gets the data for the specified image
     * @param image
     * @return {ImageData|null}
     */
    getImageData(image) {
        for (let i = 0; i < this.images.length; i++)
            if (this.images[i].image === image)
                return this.images[i];
        return null;
    }
}

/**
 * Stores the data for a single image
 * @property {string} image - name of the image
 * @property {ScanPath[]} scanpaths - stores the data of all images in the scan paths
 */
class ImageData {

    /**
     * @param image - name of the image
     */
    constructor(image) {
        this.image = image;
        this.scanpaths = [];
    }

    /**
     * Adds a single point
     * @param {int} timestamp
     * @param {int} fixationIndex
     * @param {int} fixationDuration
     * @param {float} pointX
     * @param {float} pointY
     * @param {string} person
     * @param {boolean} color
     */
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

    /**
     * Gets the scan paths
     * @param {string} [person]
     * @param {boolean} [color]
     * @return {ScanPath[]}
     */
    getScanPaths(person, color) {
        let scanPaths = [];
        for (let i = 0; i < this.scanpaths.length; i++) {
            const scanPath = this.scanpaths[i];
            if ((!person || scanPath.person === person) && (!color || scanPath.color === color))
                scanPaths.push(scanPath);
        }
        return scanPaths;
    }

}

/**
 * Stores the data for a single scan path
 * @property {string} person
 * @property {boolean} color
 * @property {ScanPoint[]} points - all points in this scan path
 */
class ScanPath {

    /**
     * @param {string} person
     * @param {boolean} color
     */
    constructor(person, color) {
        this.person = person;
        this.color = color;
        this.points = [];
    }

    /**
     * Adds a single point
     * @param {int} time
     * @param {int} fixationIndex
     * @param {int} fixationDuration
     * @param {float} x
     * @param {float} y
     */
    addPoint(time, fixationIndex, fixationDuration, x, y) {
        this.points.push(new ScanPoint(time, fixationIndex, fixationDuration, x, y));
    }

    /**
     * Gets the point for the specified time
     * @param {int} time
     * @return {null|ScanPoint}
     */
    getPoint(time) {
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].time === time)
                return this.points[i];
        }
        return null;
    }

    /**
     * Gets all points
     * @return {ScanPoint[]}
     */
    getPoints() {
        return this.points;
    }

}

/**
 * Stores a single point
 * @property {int} time
 * @property {int} fixationIndex
 * @property {int} fixationDuration
 * @property {float} x
 * @property {float} y
 */
class ScanPoint {

    /**
     * @param {int} time
     * @param {int} fixationIndex
     * @param {int} fixationDuration
     * @param {float} x
     * @param {float} y
     */
    constructor(time, fixationIndex, fixationDuration, x, y) {
        this.time = time;
        this.fixationIndex = fixationIndex;
        this.fixationDuration = fixationDuration;
        this.x = x;
        this.y = y;
    }

}