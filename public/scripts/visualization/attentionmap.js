class AttentionMap extends Visualization {

    constructor(box) {
        super(box, 'Attention Map');

        // add image to document
        this.img = document.createElement('img');
        this.img.style.width = '100%';
        this.img.style.height = '100%';
        this.box.inner.appendChild(this.img);

        // add canvas to document
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'relative';
        this.canvas.style.width = this.img.style.width;
        this.canvas.style.height = this.img.style.height;
        this.canvas.style.left = this.img.offsetLeft.toString();
        this.canvas.style.top = this.img.offsetTop.toString();
        this.canvas.setAttribute('z-index','20');
        this.box.inner.appendChild(this.canvas);

        properties.onchange.set('attentionmap', () => {
            this.updateImage();
            this.draw();
        })
    }

    updateImage(){
        this.img.setAttribute('src',properties.image ? '/testdataset/images/' + properties.image : '');
        // this.canvas.width = 0;//this.img.naturalWidth;
        // this.canvas.height = 0;//this.img.naturalHeight;
        console.log('width: ' + this.img.naturalWidth + ' height: ' + this.img.naturalHeight);
    }

    draw(){
        // clear the canvas
        const context = this.canvas.getContext('2d');
        context.clearRect(0,0,this.canvas.width,this.canvas.height);

        // return if no image is selected
        if(!properties.image)
            return;

        // draw circles where people where looking
        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();
        for(let i = 0; i < scanPaths.length; i++){
            const points = scanPaths[i].getPoints();
            for(let i2 = 0; i2 < points.length; i2++){
                const point = points[i2];
                context.fillStyle = 'red';
                context.globalAlpha = 0.5;
                context.beginPath();
                context.arc(point.x, point.y, point.fixationDuration / 25,0,2 * Math.PI,false);
                context.fill();
            }
        }
    }

}