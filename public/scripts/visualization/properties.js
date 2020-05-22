/**
 * stores the current settings, such time and image of the data
 * all visualizations should use these settings to sync between them
 * @property {string} image - the image currently selected
 * @property {float[]} rgba - the color currently selected int the format [red[0,255],green[0,255],blue[0,255],alpha[0,1]]
 * @property {int} time - the time currently selected
 * @property {Map<string,AOI>} aoi - the selected area of interest per image
 * @property {Map<string,function()>} onchange - property change listeners for all visualizations, registered by tag
 */
class Properties {

    constructor() {
        this.image = undefined;
        this.rgba = undefined;
        this.time = 0;
        this.aoi = new Map();

        this.onchange = new Map();
    }

    /**
     * Sets the currently selected image
     * @param {string} image
     */
    setImage(image){
        if(this.image === image)
            return;

        console.log('properties.js - Setting image to ' + image);

        this.image = image;

        if(this.image && !this.aoi[image])
            this.aoi[image] = new AOI(this.image);

        for(let listener of this.onchange.values())
            listener();
    }

    /**
     * Sets the current color
     * @param {float[]} rgba - [red[0,255],green[0,255],blue[0,255],alpha[0,1]]
     */
    setColor(rgba){
        if(this.rgba === rgba)
            return;

        console.log('properties.js - Setting color to (' + rgba +')');

        this.rgba = rgba;
        for(let listener of this.onchange.values())
            listener();
    }

    /**
     * Gets the current color as a hex value
     * @return {string} hex value for the color
     */
    getColorHex(){
        return "#" + ((1 << 24) + (this.rgba[0] << 16) + (this.rgba[1] << 8) + this.rgba[2]).toString(16).slice(1);
    }

    /**
     * Sets the currently defined zoom level (for gaze stripe)
     * @param {number} zoom level
     */
    setZoom(zoomValue){
        if(this.zoomValue === zoomValue)
            return;

        console.log('properties.js - Setting zoom level to ' + zoomValue);

        this.zoomValue = zoomValue;
        for(let listener of this.onchange.values())
            listener();
    }

    getCurrentAOI(){
        return this.image ? this.aoi[this.image] : new AOI('');
    }
}

/**
 * Stores the selected AOI
 * @property {string} image - the image the aoi is for
 * @property {boolean} hasSelection - whether something is currently selected
 * @property {float} left - left side of the selected area
 * @property {float} top - top side of the selected area
 * @property {float} right - right side of the selected area
 * @property {float} bottom - bottom side of the selected area
 * @property {ScanPoint[]} points - all points in the selected area
 * @property {Map<string,function()>} onchange - area of interest change listeners for all visualizations, registered by tag
 */
class AOI {

    /**
     * @param {string} image - the image the aoi is for
     */
    constructor(image) {
        this.image = image;
        this.hasSelection = false;
        this.left = 0;
        this.right = 0;
        this.top = 0;
        this.bottom = 0;
        this.points = [];
        this.onchange = new Map();
    }

    /**
     * Sets the selection to the specified area
     * @param {float} left - left side of the selected area
     * @param {float} top - top side of the selected area
     * @param {float} right - right side of the selected area
     * @param {float} bottom - bottom side of the selected area
     */
    setSelection(left, top, right, bottom){
        if(!properties.image){ // an image must be selected first
            console.error('properties.js - An image must be set first, before an area can be selected!');
            return;
        }

        this.hasSelection = true;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.points = [];
        const imageData = dataset.getImageData(properties.image);
        for(let scanPath of imageData.scanpaths){
            for(let point of scanPath.points){
                if(point.x >= left && point.x <= right && point.y >= top && point.y <= bottom)
                    this.points.push(point);
            }
        }
        if(!this.points.length)
            this.hasSelection = false;

        for(let listener of this.onchange.values())
            listener();
    }

    /**
     * Clears the selection
     */
    clearSelection(){
        this.hasSelection = false;
        this.points = [];

        for(let listener of this.onchange.values())
            listener();
    }

}