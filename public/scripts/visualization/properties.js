// stores the current settings, such time and image of the data
// all visualizations should use these settings to sync between them
class Properties {
    constructor() {
        this.image = null;
        this.time = null;

        this.onchange = [];
    }

    setImage(image){
        console.log('properties.js - Setting image to ' + image);

        this.image = image;
        for(let i = 0; i < this.onchange.length; i++)
            this.onchange[i]();
    }
}