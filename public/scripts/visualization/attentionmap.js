/**
 * Attention Map visualization
 * @property svg - selection for the svg element which shows the attention map
 * @property graphics - main group for svg elements
 * @property zoom - d3 zoom object
 * @property {number} resizeTimer - id for the timer which checks for changes in box size
 * @property {HTMLImageElement} image - image used to get the natural width and height
 */
class AttentionMap extends Visualization {

    /**
     * @param {Box} box
     */
    constructor(box) {
        super(box, 'Attention Map');

        this.width = this.box.inner.offsetWidth;
        this.height = this.box.inner.offsetHeight;

        this.svg = d3.select(this.box.inner)
            .classed('smalldot ', true)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.graphics = this.svg.append('g');

        this.zoom = d3.zoom();
        this.svg.call(
            this.zoom.on('zoom', () => this.graphics.attr('transform', d3.event.transform))
        );
        this.hasBeenCentered = false;

        this.resizeTimer = setInterval(() => {
            if (this.width !== this.box.inner.offsetWidth || this.height !== this.box.inner.offsetHeight) {
                this.hasBeenCentered ? this.maintainTransform(this.box.inner.offsetWidth, this.box.inner.offsetHeight) : this.center();
                this.width = this.box.inner.offsetWidth;
                this.height = this.box.inner.offsetHeight;
                this.svg
                    .attr('width', this.width)
                    .attr('height', this.height);
            }
        }, 100);

        this.image = new Image();
        this.image.onload = () => {
            this.hasBeenCentered = false;
            this.draw();
            this.center();
        }

        properties.onchange.set('attentionmap', event => {
            if(event.type === 'image')
                this.image.src = properties.image ? '/testdataset/images/' + properties.image : ''
            if(event.type === 'color')
                this.draw();
        })

        if(properties.image)
            this.image.src = '/testdataset/images/' + properties.image;
    }

    /**
     * Draws the attention map on the canvas
     */
    draw(){
        this.graphics.selectAll('*').remove();

        if (!properties.image)
            return;

        this.graphics.append('image')
            .attr('href', this.image.src)
            .attr('width', this.image.naturalWidth)
            .attr('height', this.image.naturalHeight);

        const imageData = dataset.getImageData(properties.image);

        let points = [];
        imageData.scanpaths.forEach(path => points = points.concat(path.points));

        let contours = d3.contourDensity()
            .x(point => point.x)
            .y(point => point.y)
            .size([this.image.naturalWidth, this.image.naturalHeight])
            .bandwidth(20)(points);

        let color = d3.scalePow().domain([0,d3.max(contours, d => d.value)]).range(['#ffffff00',properties.getColorHex()]);

        this.graphics.append('g')
            .attr('fill', 'none')
            .attr('stroke', 'none')
            .attr('stroke-linejoin', 'round')
            .selectAll('path')
            .data(contours)
            .enter().append('path')
            .attr('fill', d => color(d.value))
            .attr('stroke-width', (d, i) => i % 5 ? 0.25 : 1)
            .attr('d', d3.geoPath());
    }

    /**
     * Centers the attention map on the box
     */
    center(){
        if(this.width === 0 || this.height === 0)
            return;

        let scale = Math.min(this.width / this.image.naturalWidth, this.height / this.image.naturalHeight);
        this.svg.call(this.zoom.translateTo, this.image.naturalWidth / 2, this.image.naturalHeight / 2);
        this.svg.call(this.zoom.scaleTo, scale);

        this.hasBeenCentered = true;
    }

    /**
     * Makes sure translation and scale stays the same when resized
     * @param {number} newWidth - new box width
     * @param {number} newHeight - new box height
     */
    maintainTransform(newWidth, newHeight){
        let scale = d3.zoomTransform(this.svg.node()).k;
        this.svg.call(this.zoom.translateBy, (newWidth - this.width) / 2 / scale, (newHeight - this.height) / 2 / scale);
    }

    onRemoved() {
        if(this.resizeTimer)
            clearInterval(this.resizeTimer);
    }
}