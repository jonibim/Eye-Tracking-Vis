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
        this.img = document.createElement('img');
        this.img.onload = () => {
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
            this.draw();
        })

        if(properties.image)
            this.img.src = '/testdataset/images/' + properties.image;
        this.draw();
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
        this.ratio = Math.min(this.canvas.width / this.img.naturalWidth, this.canvas.height / this.img.naturalHeight);
        this.width = this.img.naturalWidth * this.ratio;
        this.height = this.img.naturalHeight * this.ratio;
        this.left = (this.canvas.width - this.width) / 2;
        this.top = (this.canvas.height - this.height) / 2;

        // draw the image
        context.globalAlpha = 1;
        context.drawImage(this.img, this.left, this.top, this.width, this.height);

        // draw circles where people where looking
        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();
        for (let i = 0; i < scanPaths.length; i++) {
            const points = scanPaths[i].getPoints();
            for (let i2 = 0; i2 < points.length; i2++) {
                const point = points[i2];

                if(properties.aoi.hasSelection && properties.aoi.points.includes(point))
                    context.fillStyle = 'blue';
                else
                    context.fillStyle = 'red';
                context.globalAlpha = 0.5;

                let x = this.left + point.x / this.img.naturalWidth * this.width;
                let y = this.top + point.y / this.img.naturalHeight * this.height;

                context.beginPath();
                context.arc(x, y, point.fixationDuration / 25 * this.ratio, 0, 2 * Math.PI, false);
                context.fill();
            }
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