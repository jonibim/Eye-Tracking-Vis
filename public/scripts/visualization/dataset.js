/**
 * Loads and stores a dataset
 * @property {boolean} isLoaded - whether a dataset is loaded
 * @property {function()[]} onload - listeners for when a dataset is loaded
 * @property {ImageData[]} images - stores the data of all images in the dataset
 * @property {string} name - name of the loaded dataset
 * @property {string} url - url of the folder for the loaded dataset
 */
class Dataset {

    constructor() {
        this.isLoaded = false;
        this.onload = [];
    }

    /**
     * Imports the data from the given string
     * @param {string} data - the data to be imported
     * @param {string} url - url of the folder for the data
     */
    importData(data, url) {
        //console.log('dataset.js - Importing data...')
        this.url = url;
        this.images = [];

        this.name = 'Metro maps research by Rudolf Netzel'; // TODO add dynamic naming

        let json = JSON.parse(data);

        for (let entry of json)
            this.addData(entry.StimuliName, entry.Timestamp, entry.FixationIndex, entry.FixationDuration, entry.MappedFixationPointX, entry.MappedFixationPointY, entry.user, entry.description);

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
            parseFloat(pointX), parseFloat(pointY), person, color === 'color'); // TODO handle exceptions
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
        let scanPath = new ScanPath(this, person, color);
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
 * @property {ImageData} image - the image this path belongs to
 * @property {string} person
 * @property {boolean} color
 * @property {ScanPoint[]} points - all points in this scan path
 */
class ScanPath {

    /**
     * @param {ImageData} image - the image this path belongs to
     * @param {string} person
     * @param {boolean} color
     */
    constructor(image, person, color) {
        this.image = image;
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
        this.points.push(new ScanPoint(this, time, fixationIndex, fixationDuration, x, y));
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

    getNextPoint(time) {
        for (let i = 0; i < this.points.length; i++) {
            if (this.points[i].time === time)
                return this.points[i+1];
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
 * @property {ScanPath} path - the scan path this points belongs to
 * @property {int} time
 * @property {int} fixationIndex
 * @property {int} fixationDuration
 * @property {float} x
 * @property {float} y
 */
class ScanPoint {

    /**
     * @param {ScanPath} path - the scan path this points belongs to
     * @param {int} time
     * @param {int} fixationIndex
     * @param {int} fixationDuration
     * @param {float} x
     * @param {float} y
     */
    constructor(path, time, fixationIndex, fixationDuration, x, y) {
        this.path = path;
        this.time = time;
        this.fixationIndex = fixationIndex;
        this.fixationDuration = fixationDuration;
        this.x = x;
        this.y = y;
    }

}