/**
 * stores the current settings, such time and image of the data
 * all visualizations should use these settings to sync between them
 * @property {string} image - the image currently selected
 * @property {float[]} rgba - the color currently selected int the format [red[0,255],green[0,255],blue[0,255],alpha[0,1]]
 * @property {int} time - the time currently selected
 * @property {Map<string,AOI[]>} aoi - the areas of interest per image
 * @property {Map<string,Map<string,function({type: 'image', oldImage: string, newImage: string}|{type: 'color', color: number[], red: int, green: int, blue: int}|{type: 'zoom', oldZoom: number, newZoom: number}|{type: 'users', users: string[]}|{type: 'aoi', aoi: AOI[]})>>} onchange - property change listeners for all visualizations, registered by tag
 */
class Properties {

    constructor() {
        this.image = undefined;
        this.rgba = [0, 0, 0, 0];
        this.time = 0;
        this.aoi = new Map();
        this.zoomValue = undefined;
        this.users = [];
        this.ecSliders = [];

        this.events = ['image', 'color', 'zoom', 'users', 'aoi', 'sync', 'upload', 'ec'];
        this.onchange = new Map();
        for (let event of this.events)
            this.onchange.set(event, new Map());
    }



    /**
     * Sets the currently selected image
     * @param {string} image
     */
    setImage(image) {
        if (this.image === image || !image)
            return;

        //console.log('properties.js - Setting image to ' + image);

        let oldImage = this.image;
        this.image = image;

        //console.log(this.aoi.get(image))
        if (this.image && !this.aoi.get(image))
            this.aoi.set(image, []);

        for (let listener of this.onchange.get('image').values())
            listener({ type: 'image', oldImage: oldImage, newImage: image });
    }


    /**
     * Sets the current color
     * @param {float[]} rgba - [red[0,255],green[0,255],blue[0,255],alpha[0,1]]
     */
    setColor(rgba) {
        if (this.rgba && this.rgba[0] === rgba[0] && this.rgba[1] === rgba[1] && this.rgba[2] === rgba[2] && this.rgba[3] === rgba[3])
            return;

        //console.log('properties.js - Setting color to (' + rgba + ')');

        this.rgba = [...rgba];
        for (let listener of this.onchange.get('color').values())
            listener({ type: 'color', color: rgba, red: rgba[0], green: rgba[1], blue: rgba[2], alpha: rgba[3] });
    }

    /**
     * Gets the current color as a hex value
     * @return {string} hex value for the color
     */
    getColorHex() {
        return "#" + ((1 << 24) + (this.rgba[0] << 16) + (this.rgba[1] << 8) + this.rgba[2]).toString(16).slice(1);
    }

    /**
     * Sets the currently defined zoom level (for gaze stripe)
     * @param {number} zoomValue level
     */
    setZoom(zoomValue) {
        if (this.zoomValue === zoomValue)
            return;

        //console.log('properties.js - Setting zoom level to ' + zoomValue);

        let oldZoom = this.zoomValue;
        this.zoomValue = zoomValue;
        for (let listener of this.onchange.get('zoom').values())
            listener({ type: 'zoom', oldZoom: oldZoom, newZoom: zoomValue });
    }

    /**
     * Sets the currently selected users
     * @param {string[]} users
     */
    setUsers(users) {
        if (this.users.length === users.length) {
            let difference;
            for (let element of users) {
                if (!this.users.includes(element)) {
                    difference = true;
                    break;
                }
            }
            if (!difference)
                return;
        }

        //console.log('properties.js - Setting users to ' + users.length + (users.length === 1 ? ' user' : ' users'));

        this.users = [...users];
        for (let listener of this.onchange.get('users').values())
            listener({ type: 'users', users: users });


        for (let listener of properties.onchange.get('sync').values())
            listener()


    }

    /**
     * Sets the current eye cloud slider values
     * @param {number} ecRange
     * @param {number} ecMinRadius
     * @param {number} ecMaxRadius
     * @param {number} ecMaxCircles
     */
    setEyeCloudSettings(ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles) {
        if (this.ecSliders[0] === ecRange && this.ecSliders[1] === ecMinRadius && this.ecSliders[2] === ecMaxRadius && this.ecSliders[3] === ecMaxCircles)
            return;

        //console.log('properties.js - Setting ec sliders to', ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles);

        let oldecSliders = [...this.ecSliders];
        this.ecSliders = [ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles];
        for (let listener of this.onchange.get('ec').values())
            listener({ type: 'ec', oldecSliders: oldecSliders, newecSliders: ecSliders });
    }
    /**
     * Sets the given listener to the given events
     * @param {string} tag - the tag of the visualization adding the listener, same as for the registry
     * @param {[]|'image'|'color'|'zoom'|'users'|'aoi'} events - the events to add the listener to
     * @param {function({type: 'image', oldImage: string, newImage: string}|
     * {type: 'color', color: number[], red: int, green: int, blue: int}|
     * {type: 'zoom', oldZoom: number, newZoom: number}|
     * {type: 'users', users: string[]}|
     * {type: 'aoi', aoi: AOI[]})} listener
     */
    setListener(tag, events, listener) {
        if (typeof events === 'string')
            events = [events];

        for (let event of events) {
            if (!this.events.includes(event)) {
                console.error('There\'s no event called \'' + event + '\'');
                continue;
            }

            this.onchange.get(event).set(tag, listener);
        }
    }

    /**
     * @return {AOI[]} AOIs for the selected image
     */
    getCurrentAOI() {
        return this.image ? this.aoi.get(this.image) : [];
    }

    /**
     * @return {int} the number of AOIs for the selected image
     */
    getCurrentAOIsize() {
        return this.aoi.get(this.image).length;
    }

    /**
     * @return {[]} Selected users for the selected image
     */
    getCurrentUsers() {
        return this.users
    }

    /**
     * @return {number} The zoom value for the selected image
     */
    getCurrentZoom() {
        return this.zoomValue
    }

    /**
     * @return {float[]} The zoom value for the selected image
     */
    getCurrentColor() {
        return this.rgba
    }

    /**
     * @return {string} The selected image
     */
    getCurrentImage() {
        return this.image
    }

    /**
     * @return {number[]} The current eye cloud slider values
     */
    getCurrentECSliders() {
        return this.ecSliders
    }

    /**
     * Removes all AOIs for the selected image
     */
    removeCurrentAOIs() {
        let aoi = [];
        this.aoi.set(this.image, aoi);

        for (let listener of this.onchange.get('aoi').values())
            listener({ type: 'aoi', aoi: aoi });
    }
}

/**
 * Stores the selected AOI
 * @property {string} image - the image the aoi is for
 * @property {string} id - the id for the aoi in that image
 * @property {float} left - left side of the selected area
 * @property {float} top - top side of the selected area
 * @property {float} right - right side of the selected area
 * @property {float} bottom - bottom side of the selected area
 * @property {ScanPoint[]} points - all points in the selected area
 */
class AOI {

    /**
     * @param {string} image - the image the aoi is for
     */
    constructor(image) {
        this.image = image;
        this.id = null;
        this.left = 0;
        this.right = 0;
        this.top = 0;
        this.bottom = 0;
        this.points = [];
    }

    /**
     * Sets the selection to the specified area
     * @param {float} left - left side of the selected area
     * @param {float} top - top side of the selected area
     * @param {float} right - right side of the selected area
     * @param {float} bottom - bottom side of the selected area
     * @param {string} id - used to idenitfy the created aoi unqieluely. 
     */
    setSelection(left, top, right, bottom, id) {
        if (!properties.image) { // an image must be selected first
            console.error('properties.js - An image must be set first, before an area can be selected!');
            return;
        }

        this.id = id
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.points = [];
        const imageData = dataset.getImageData(properties.image);
        for (let scanPath of imageData.scanpaths) {
            for (let point of scanPath.points) {
                if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom)
                    this.points.push(point);
            }
        }

        if (this.image === properties.image)
            for (let listener of properties.onchange.get('aoi').values())
                listener({ type: 'aoi', aoi: properties.aoi.get(this.image) });
    }

    /**
     * @param {ScanPoint | [2]} point - the point to check, can be either a ScanPath or [x, y]
     * @return {boolean} whether the given point is inside this aoi
     */
    includesPoint(point) {
        if (point instanceof ScanPoint)
            return this.points.includes(point);
        return this.left <= point[0] && this.right >= point[0] && this.top <= point[1] && this.bottom >= point[1];
    }

    /**
     * Removes this AOI
     */
    remove() {
        let index = properties.aoi.get(this.image).indexOf(this);

        if (index < 0)
            return;

        properties.aoi.get(this.image).splice(index, 1);

        if (this.image === properties.image)
            for (let listener of properties.onchange.get('aoi').values())
                listener({ type: 'aoi', aoi: properties.aoi.get(this.image) });
    }



}