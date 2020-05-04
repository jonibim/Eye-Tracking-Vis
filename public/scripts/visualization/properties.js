/**
 * stores the current settings, such time and image of the data
 * all visualizations should use these settings to sync between them
 * @property {string} image - the image currently selected
 * @property {int} time - the time currently selected
 * @property {Map<string,function>} onchange - property change listeners for all visualizations, registered by tag
 */
class Properties {

    constructor() {
        this.image = "";
        this.time = 0;

        this.onchange = new Map();
    }

    /**
     * Sets the currently selected image
     * @param {string} image
     */
    setImage(image){
        console.log('properties.js - Setting image to ' + image);

        this.image = image;
        for(let i = 0; i < this.onchange.length; i++)
            this.onchange[i]();
    }
}