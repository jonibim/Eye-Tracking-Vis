/**
 * stores the current settings, such time and image of the data
 * all visualizations should use these settings to sync between them
 * @property {string} image - the image currently selected
 * @property {int} time - the time currently selected
 * @property {AOI} aoi - the selected area of interest
 * @property {Map<string,function()>} onchange - property change listeners for all visualizations, registered by tag
 */
class Properties {

    constructor() {
        this.image = undefined;
        this.time = 0;
        this.aoi = new AOI();

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
        for(let listener of this.onchange.values())
            listener();
    }
}

/**
 * Stores the selected AOI
 * @property {boolean} hasSelection - whether something is currently selected
 * @property {float} left - left side of the selected area
 * @property {float} top - top side of the selected area
 * @property {float} right - right side of the selected area
 * @property {float} bottom - bottom side of the selected area
 * @property {ScanPoint[]} points - all points in the selected area
 * @property {Map<string,function>} onchange - area of interest change listeners for all visualizations, registered by tag
 */
class AOI {

    constructor() {
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

        this.points = [];
        const imageData = dataset.getImageData(properties.image);
        for(let scanPath of imageData.scanpaths){
            for(let point of scanPath.points){
                if(point.x >= left && point.x <= right && point.y >= top && point.y <= bottom)
                    this.points.push(point);
            }
        }
    }

    /**
     * Clears the selection
     */
    clearSelection(){
        this.hasSelection = false;
        this.points = [];
    }

}