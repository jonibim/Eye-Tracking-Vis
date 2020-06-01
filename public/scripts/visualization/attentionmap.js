/**
 * Attention Map visualization
 * @property svg - selection for the svg element which shows the attention map
 * @property graphics - main group for svg elements
 * @property zoom - d3 zoom object
 * @property {number} resizeTimer - id for the timer which checks for changes in box size
 * @property {HTMLImageElement} image - image used to get the natural width and height
 */
class AttentionMap extends AOIVisualization {

    /**
     * @param {Box} box
     */
    constructor(box) {
        super(box, 'Attention Map', 'atviz', 'attentionmap');
    }

    /**
     * Draws the attention map on the canvas
     */
    drawForeground() {
        const imageData = dataset.getImageData(properties.image);

        let points = [];
        imageData.scanpaths.forEach(path => {
            if (properties.users.includes(path.person))
                points = points.concat(path.points);
        });

        // remove points not in the AOIs
        if(properties.getCurrentAOI().length) {
            loop: for (let i = 0; i < points.length; i++) {
                for (let aoi of properties.getCurrentAOI()) {
                    if (aoi.includesPoint(points[i]))
                        continue loop;
                }
                points.splice(i, 1);
                i--;
            }
        }

        let contours = d3.contourDensity()
            .x(point => point.x)
            .y(point => point.y)
            .size([this.image.naturalWidth, this.image.naturalHeight])
            .bandwidth(20)(points);

        let color = d3.scalePow().domain([0, d3.max(contours, d => d.value)]).range(['#ffffff00', properties.getColorHex()]);

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
}