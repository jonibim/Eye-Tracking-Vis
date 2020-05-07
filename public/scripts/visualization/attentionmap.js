/**
 * Attention Map visualization
 */
class AttentionMap extends Visualization {

    /**
     * @param {Box} box
     */
    constructor(box) {
        super(box, 'Attention Map');

        this.selecting = false;
        this.selectionX = false;
        this.selectionY = false;
        this.selectionWidth = false;
        this.selectionHeight = false;

        // create an image element just to load the image from the server
        this.img = new Image();
        this.img.onload = () => {
            this.ratio = 0;
            this.draw();
        }

        // add canvas to document
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'relative';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.box.inner.appendChild(this.canvas);

        // update area of interest
        this.canvas.onmousedown = e => this.startSelection(e);
        this.canvas.onmouseup = e => this.completeSelection(e);
        this.canvas.onmouseleave = e => this.discardSelection(e);
        this.canvas.onmousemove = e => this.checkSelection(e);

        // make sure canvas resolution is the same as it's size
        this.timer = setInterval(() => {
            if(this.canvas.clientHeight !== this.canvas.height || this.canvas.clientWidth !== this.canvas.width){
                this.canvas.width = this.canvas.clientWidth;
                this.canvas.height = this.canvas.clientHeight;
                this.draw();
            }
        },100);

        // redraw when selected image changes
        properties.onchange.set('attentionmap', () => {
            this.img.src = properties.image ? '/testdataset/images/' + properties.image : '';
        })

        if(properties.image)
            this.img.src = properties.image ? '/testdataset/images/' + properties.image : '';
    }

    /**
     * Draws the attention map on the canvas
     */
    draw() {
        const context = this.canvas.getContext('2d');

        // clear the canvas
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // return if no image is selected
        if (!properties.image)
            return;

        // make sure aspect ration is maintained
        let ratio = Math.min(this.canvas.width / this.img.naturalWidth, this.canvas.height / this.img.naturalHeight);
        if(ratio !== this.ratio) {
            this.ratio = ratio;
            this.width = this.img.naturalWidth * this.ratio;
            this.height = this.img.naturalHeight * this.ratio;
            this.left = (this.canvas.width - this.width) / 2;
            this.top = (this.canvas.height - this.height) / 2;
            this.gatherColorRaster();
        }

        // draw the image
        if(this.img) {
            context.globalAlpha = 1;
            context.drawImage(this.img, this.left, this.top, this.width, this.height);
        }

        // draw circles where people where looking
        let total = 0;
        let count = 0;
        for(let key in this.raster){
            let x = parseInt(key.substring(0,key.indexOf(':')));
            let y = parseInt(key.substring(key.indexOf(':') + 1));
            let index = (Math.sin(this.raster[key] / this.highestIndex * Math.PI / 2)) * 255;
            // let index = raster[key] / highest * 255;
            let inverted = 255 - index;
            if(!properties.aoi.hasSelection || (x > properties.aoi.left / this.img.naturalWidth * this.width + this.left && x < properties.aoi.right / this.img.naturalWidth * this.width + this.left && y > properties.aoi.top / this.img.naturalHeight * this.height + this.top && y < properties.aoi.bottom / this.img.naturalHeight * this.height + this.top))
                context.fillStyle = 'rgba(' + index + ',' + inverted + ',0,' + (index / 255) + ')';
            else
                context.fillStyle = 'rgba(' + index + ',' + index + ',' + index + ',' + (index / 255 * 0.6 + 0.1) + ')';
            context.fillRect(x,y,1,1);

            total += this.raster[key];
            count++;
        }

        // draw selection
        if(this.selecting) {
            context.fillStyle = 'blue';
            context.globalAlpha = 0.6;
            context.fillRect(this.selectionX, this.selectionY, this.selectionWidth, this.selectionHeight);
        }

        this.drawScale();
    }

    /**
     * Gets the attention per pixel of the image
     */
    gatherColorRaster(){
        this.raster = {};
        this.highestIndex = 0;

        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();

        for (let scanPath of scanPaths) {
            const points = scanPath.getPoints();
            for (let point of points) {
                let radius = Math.ceil(point.fixationDuration / 15 * this.ratio);
                for(let x = -radius; x <= radius; x++){
                    for(let y = -radius; y <= radius; y++){
                        if(x * x + y * y <= radius * radius){
                            let key = (Math.floor(point.x / this.img.naturalWidth * this.width + x) + this.left) + ':' + (Math.floor(point.y / this.img.naturalHeight * this.height + y) + this.top);
                            let index = Math.pow(radius - Math.sqrt(x * x + y * y),1/500);
                            if(this.raster[key])
                                this.raster[key] += index;
                            else
                                this.raster[key] = index;

                            if(this.raster[key] > this.highestIndex)
                                this.highestIndex = this.raster[key];
                        }
                    }
                }
            }
        }
    }

    /**
     *
     */
    drawScale(){
        // TODO
    }

    /**
     * Updates the area of interest when dragging starts
     * @param {MouseEvent} event
     */
    startSelection(event){
        if(this.selecting)
            return;

        let bounds = event.target.getBoundingClientRect();
        let x = event.clientX - bounds.left;
        let y = event.clientY - bounds.top;

        if(x < this.left || x > this.left + this.width || y < this.top || y > this.top + this.height)
            return;

        this.selecting = true;
        this.selectionX = x;
        this.selectionY = y;
        this.selectionWidth = 0;
        this.selectionHeight = 0;
    }

    /**
     * Updates the area of interest when dragging stops
     * @param {MouseEvent} event
     */
    completeSelection(event){
        if(!this.selecting)
            return;

        let bounds = event.target.getBoundingClientRect();
        let x = event.clientX - bounds.left;
        let y = event.clientY - bounds.top;

        this.selecting = false;
        this.selectionWidth = x - this.selectionX;
        this.selectionHeight = y - this.selectionY;

        let left = Math.min(this.selectionX, this.selectionX + this.selectionWidth) - this.left;
        let top = Math.min(this.selectionY, this.selectionY + this.selectionHeight) - this.top;
        let right = Math.max(this.selectionX, this.selectionX + this.selectionWidth) - this.left;
        let bottom = Math.max(this.selectionY, this.selectionY + this.selectionHeight) - this.top;

        left = left / this.width * this.img.naturalWidth;
        top = top / this.height * this.img.naturalHeight;
        right = right / this.width * this.img.naturalWidth;
        bottom = bottom / this.height * this.img.naturalHeight;

        properties.aoi.setSelection(left,top,right,bottom);

        this.draw();
    }

    /**
     * Updates the area of interest when dragging stops
     * @param {MouseEvent} event
     */
    discardSelection(event){
        this.selecting = false;
        this.draw();
    }

    /**
     * Updates the area of interest when dragging stops
     * @param {MouseEvent} event
     */
    checkSelection(event){
        if(!this.selecting)
            return;

        let bounds = event.target.getBoundingClientRect();
        let x = event.clientX - bounds.left;
        let y = event.clientY - bounds.top;

        if(x < this.left || x > this.left + this.width || y < this.top || y > this.top + this.height) {
            this.selecting = false;
            this.draw();
            return;
        }

        if(this.selectionWidth !== x - this.selectionX || this.selectionY !== y - this.selectionY){
            this.selectionWidth = x - this.selectionX;
            this.selectionHeight = y - this.selectionY;
            this.draw();
        }
    }

    /**
     * Called right before this visualization gets removed
     */
    onRemoved() {
        // stop the timer
        if(this.timer)
            clearInterval(this.timer);
    }

}