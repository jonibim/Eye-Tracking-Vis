class Editor extends Visualization {

    constructor(box) {
        super(box, 'AOI Editor');

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

        properties.onchange.set('editor', () => {
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

    // the same as in attentionmap.js but will change later

    databind(data){
        var customBase = document.createElement('custom');
        var custom = d3.select(customBase); 
        var join = custom.selectAll('custom.rect')  .data(data);
    }

    draw(){
        //WIP
    }       

}