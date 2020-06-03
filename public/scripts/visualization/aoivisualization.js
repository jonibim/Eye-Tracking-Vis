/**
 * Attention Map visualization
 * @property svg - selection for the svg element which shows the attention map
 * @property graphics - main group for svg elements
 * @property zoom - d3 zoom object
 * @property {boolean} hasBeenCentered
 * @property {number} resizeTimer - id for the timer which checks for changes in box size
 * @property {HTMLImageElement} image - image used to get the natural width and height
 */
class AOIVisualization extends Visualization {

    /**
     * @param {Box} box
     * @param {string} title
     * @param {string} classname - used to identify the container in HTML from javascript
     * @param {string} id - id of the visualization, same as used for the registry
     */
    constructor(box, title, classname, id) {
        super(box, title, classname);

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
            this.zoom.on('zoom', () => {
                this.graphics.attr('transform', d3.event.transform)
                properties.zoomListeners.forEach(listener => listener(d3.event.transform))
            })
        );
        // Use left mouse button for selecting when brushing is enabled
        this.zoom.filter(() => !this.brush || (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));
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

        properties.onchange.set(id, event => {
            if (event.type === 'image')
                this.image.src = properties.image ? dataset.url + '/images/' + properties.image : '';
            if (event.type === 'color' || event.type === 'users' || event.type === 'aoi')
                this.draw();
        })

        if (properties.image)
            this.image.src = dataset.url + '/images/' + properties.image;

        properties.zoomListeners.push((zoomCord) => this.syncZoom(zoomCord))
    }

    syncZoom(zoomCord){
        this.graphics.attr('transform', zoomCord)
    }

    /**
     * Draws the attention map on the canvas
     */
    draw() {
        this.graphics.selectAll('*').remove();

        if (!properties.image)
            return;

        this.graphics.append('image')
            .attr('href', this.image.src)
            .attr('width', this.image.naturalWidth)
            .attr('height', this.image.naturalHeight);

        this.drawForeground();

        if (this.brush) {
            this.graphics.call(d3.brush()
                // set the area that can be selected
                .extent([[-100, -100], [this.image.naturalWidth + 100, this.image.naturalWidth + 100]])
                // the 'start brush' event gets called every time the selection changes
                .on('start brush', () => {
                    let selection = d3.event.selection;
                    this.hasSelection = selection != null;
                    if (selection !== null) {
                        this.selectionLeft = selection[0][0];
                        this.selectionTop = selection[0][1];
                        this.selectionRight = selection[1][0];
                        this.selectionBottom = selection[1][1];
                        this.graphics.selectAll('circle').classed('selected', (d) => this.isBrushed({left: this.selectionLeft, top: this.selectionTop, right: this.selectionRight, bottom: this.selectionBottom}, (d.x), (d.y)));
                    }
                }));

            // draw all the AOIs
            for (let i = 0; i < properties.getCurrentAOI().length; i++) {
                let aoi = properties.getCurrentAOI()[i];

                let rect = this.graphics.append('g').attr('id', 'aoi' + i).classed('aoi', true);

                rect.append('rect').classed('aoiRect', true).attr('width', aoi.right - aoi.left)
                    .attr('height', aoi.bottom - aoi.top).attr('x', aoi.left).attr('y', aoi.top)
                    .on('mouseover', function () {
                        d3.select(this).classed('ontop', true).transition().duration(250).style('fill', '#0f2fff');
                    })
                    .on('mouseout', function () {
                        d3.select(this).classed('ontop', false).transition().duration(250).style('fill', '#878787');
                    })

                rect.append('text').classed('aoiText', true).attr('x', aoi.left + 5).attr('y', aoi.top + 27).text('AOI ' + (i + 1));

                this.graphics.selectAll('circle').classed('underAoi', (d) => this.isBrushed(aoi, (d.x), (d.y)));
            }
        }

        this.graphics.on('contextmenu', d3.contextMenu(() => this.createMenu()));
    }

    /**
     * Called after the background has been drawn
     */
    drawForeground(){}

    /**
     * Centers the attention map on the box
     */
    center() {
        if (this.width === 0 || this.height === 0 || this.image.naturalWidth === 0 || this.image.naturalHeight === 0)
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
    maintainTransform(newWidth, newHeight) {
        let scale = d3.zoomTransform(this.svg.node()).k;
        this.svg.call(this.zoom.translateBy, (newWidth - this.width) / 2 / scale, (newHeight - this.height) / 2 / scale);
    }

    onRemoved() {
        if (this.resizeTimer)
            clearInterval(this.resizeTimer);
    }

    /**
     * Identify the points under the area
     * @param {AOI | {left: number, top: number, right: number, bottom: number}} area - The aoi area
     * @param {number} x - The data x-coordinate
     * @param {number} y - The data y-coordinate
     */
    isBrushed(area, x, y) {
        return x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    }

    /**
     * Disable brushing
     */
    disableBrush() {
        if (!this.brush)
            return;

        this.brush = false;
        this.draw();
    }

    /**
     * Enable brushing
     */
    enableBrush() {
        if (this.brush)
            return;

        this.brush = true;
        this.draw();
    }

    /**
     * Adds the current selection to the AOIs
     */
    addAoi() {
        let aoi = new AOI(properties.image);
        properties.getCurrentAOI().push(aoi);
        aoi.setSelection(this.selectionLeft, this.selectionTop, this.selectionRight, this.selectionBottom);
    }

    /**
     * Delete the AOI corresponding to the given object
     * @param object - object to remove the AOI for
     */
    deleteAOI(object) {
        if (!object.id || !object.id.startsWith('aoi'))
            object = object.parentElement;

        if (!object || !object.id || !object.id.startsWith('aoi')) {
            console.log('INVALID OBJECT!!!');
            return;
        }

        let id = parseInt(object.id.substr('aoi'.length));
        properties.getCurrentAOI()[id].remove();
        this.sync();
    }

    // TODO maybe change this to use properties#onchange with {type: 'aoi'}, although I'm not completely sure
    sync(){
        if (registry.map.get('transitiongraph').instance)
            properties.eventListeners.forEach(listener => listener());
    }

    createMenu(){
        let result = [];

        if (this.brush) {
            if (this.hasSelection) {
                let height = this.selectionBottom - this.selectionTop;
                let width = this.selectionRight - this.selectionLeft;
                if (height > 50 && width > 50) {
                    result.push({
                            title: 'Add AOI',
                            action: () => {this.addAoi();this.sync();}
                        }, {divider: true});
                }
            }
            result.push({
                    title: 'Disable Brush',
                    action: () => this.disableBrush()
                }, {divider: true});
        } else {
            result.push({
                    title: 'Enable Brush',
                    action: () => this.enableBrush()
                }, {divider: true});

            let elementMouseIsOver = document.elementFromPoint(d3.event.clientX, d3.event.clientY);
            if (elementMouseIsOver.classList.contains('ontop')) {
                result.push({
                        title: 'Delete AOI',
                        action: () => this.deleteAOI(elementMouseIsOver)
                    });
            }

        }

        result.push({
            title: 'Clear all AOIs',
            action: () => {
                properties.removeCurrentAOIs();
                this.sync();
                this.draw();
            }
        });

        return result;
    }
}