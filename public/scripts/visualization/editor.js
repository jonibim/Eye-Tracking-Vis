/**
 * Class used for the editor visualization
 */
class Editor extends Visualization {

    /**
     * The constructor for maintating the whole visualization
     * @param {Box} box - The box containing the visualization
     */
    constructor(box) {

		/**
		 * the third parameter is used as a identifier for the HTML 
		 * object so that it can be modified easily from the code
		 * Such modifications can be as adding a loader
		 */
        super(box, 'AOI Editor', 'editor');

        this.width = this.box.inner.clientWidth;
        this.height = this.box.inner.clientHeight;

        /**
         * create an image element just to load the image from the server
         */
        this.image = new Image();
        this.image.onload = () => {
            this.hasBeenCentered = false;
            this.draw();
            this.center();
        }

        /**
         * Create the svg inside the box
         */
        this.svg = d3.select(this.box.inner)
            .classed("smalldot ", true)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        /**
        * Create the object for the zoom
        * We create an element as we later are going to modify this element
        */
        this.zoom = d3.zoom();

        /**
         * Create the graphic element for all the visualization
         * In here we also append the zoom function
         */
        this.svgG = this.svg
            .call(this.zoom.on("zoom", () => {
                this.svgG.attr("transform", d3.event.transform);
                let visualization = registry.getVisualizationInstance('attentionmap');
                if (visualization) visualization.syncZoom(d3.event.transform);
            }))
            .append("g");


        /**
         * The paths and the dots are saved in this graphic tag
         */
        this.svgGcomposition = this.svgG.append('g');


        /**
         * We filter the zoom function as it usually binds 
         * mouse left click as Pan tool
         * However, that conflicts with the brush, therefore we forward
         * the function to the mouse wheel for zooming in and out
         * and mouse wheel click for the Pan tool
         */
        this.zoom.filter(() => (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));


        /**
         * This is used for maintaining the windows size
         * Instead we could also use an event listener
         */
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

        /**
         * Listeners for setting new images
         */
        properties.setListener('editor', 'image', event =>
            this.image.src = properties.image ? dataset.url + '/images/' + properties.image : ''
        )

        if (properties.image)
            this.image.src = dataset.url + '/images/' + properties.image;


        /**
         * Listeners for the show/hide users 
         */
        properties.setListener('editor', 'hideUser', (user) => this.hideUser(user))
        properties.setListener('editor', 'showUser', (user) => this.showUser(user))


        /**
         * The menu part for clearing All AOIs
         */
        this.clearAllAoiMenu = {
            title: 'Clear all AOIs',
            action: () => {
                this.svgG.selectAll('.aoi').remove()
                this.svgG.selectAll('circle').classed('underAoi', false)
                properties.aoi.set(properties.image, [])
                this.sync()
            }
        };


        /** Main Context menu */
        this.menu = [
            {
                title: 'Enable Brush',
                action: () => this.startBrush()
            },
            {
                divider: true
            },
            this.clearAllAoiMenu,
            {
                divider: true
            },
            {
                title: 'Fixation info',
            },
            {
                title: (d) => {
                    return 'X-Coordinate ' + d.x;
                }
            },
            {
                title: (d) => {
                    return 'Y-Coordinate ' + d.y;
                }
            },

        ];


        /** Dynamic menu which is created according to the positon of the mouse */
        this.dynamicMenu = () => {

            let addAoiMenu = {
                title: 'Add AOI',
                action: () => {
                    this.addAoi();
                    this.sync();
                }
            };

            let result = [];

            /** Save the object which is below mouse
             * This is done in order to see if the mouse 
             * is on top of the aois
             */
            let x = event.clientX, y = event.clientY,
                elementMouseIsOver = document.elementFromPoint(x, y);
            //console.log(elementMouseIsOver)
            if (this.brush) {
                if (this.extent) {
                    this.bottom = this.extent[1][1] - this.extent[0][1]
                    this.right = this.extent[1][0] - this.extent[0][0]
                    if (this.bottom > 50 && this.right > 50) {
                        result.push(addAoiMenu)
                        result.push({
                            divider: true
                        })
                    }
                }
                result.push({
                    title: 'Disable Brush',
                    action: () => this.clearBrush()
                })

            } else {
                result.push(
                    {
                        title: 'Enable Brush',
                        action: () => this.startBrush()
                    },
                    {
                        divider: true
                    })

                if (elementMouseIsOver.classList.contains('ontop')) {
                    this.rectangle = elementMouseIsOver
                    result.push(
                        {
                            title: 'Delete AOI',
                            action: () => this.deleteAOI(this.rectangle)
                        })
                }

            }

            result.push(this.clearAllAoiMenu)

            return result
        };


    }



    /**
     * 
     * @param {d3.event.transform} zoomCord - The zoom coordinate provided by the d3 event 
     */
    syncZoom(zoomCord) {
        this.svgG.attr('transform', zoomCord)
    }

    /**
     * Draws the visualization
     */
    draw() {

        /**
         * Clear the previous drawing
         */
        this.svgG.selectAll("*").remove();
        this.clearBrush()

        if (!properties.image) {
            return;
        }

        /**
         * Get the current data for the image
         */
        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();

        /**
         * Attach the image to the background of svg
         */
        this.svgG.append('svg:image')
            .attr('xlink:href', this.image.src)
            .attr('x', this.left)
            .attr('y', this.top)
            .attr('width', this.naturalWidth)
            .attr('height', this.naturalHeight)

        /**
         * The loop for displaying the dots and the paths
         */
        scanPaths.forEach(scanPath => {

            const points = scanPath.getPoints();

            this.lineFunction = d3.line()
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                })

            this.svgGcomposition = this.svgG.append('g').attr('id', scanPath.person)

            /** Draw paths */
            this.svgGcomposition.append("path")
                .attr("d", this.lineFunction(points))
                .attr("class", "line")
                .style("stroke-width", 6)
                .style("stroke", "rgb(6,120,155)")
                .style("fill", "none")
                .style("opacity", 0.4)
                .on("mouseover", function () {
                    d3.select(this)
                        .transition().duration(250).style("stroke", "orange");
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .transition().duration(250).style("stroke", "rgb(6,120,155)");
                });

            /** Draw dots */
            this.svgGcomposition.selectAll("dot")
                .data(points)
                .enter().append("circle")
                .attr("r", 20)
                .attr("cx", function (d) { return (d.x); })
                .attr("cy", function (d) { return (d.y); })
                .style("opacity", 0.8)
                .style('fill', '#FF0000')
                .on('contextmenu', d3.contextMenu(this.menu))
                .on('mouseover', function () {
                    d3.select(this)
                        .transition().duration(250).style('fill', '#0f2fff');
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .transition().duration(1000).style('fill', '#FF0000');
                })




        });

        /** Draw previous AOIs */

        this.previousAOIs = properties.getCurrentAOI()

        if (this.previousAOIs) {
            this.previousAOIs.forEach(aoi => {
                var tempName = 'aoi' + aoi.id
                this.drawAOI(aoi.id, tempName, aoi.right, aoi.bottom, aoi.left, aoi.top)
            })
        }


        /**
         * Call the brush
         */
        this.startBrush();

    }


    /**
     * Identify the points under the region
     * @param {Float} brush_coords - The brush/selection coordinates
     * @param {Float} cx - The data (point) y-coordinate 
     * @param {Float} cy - The data (point) y-coordinate 
     */
    isBrushed(brush_coords, cx, cy) {
        let x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; //Return TRUE or alse
    }

    /**
     * Clear Brush when disabled
     */

    clearBrush() {

        if (!this.brush) {
            //console.log("No Brush Exists")
            return;
        }
        this.svgG.selectAll('circle').classed('underAoi', false).classed('selected', false)
        this.brush.clear(this.svgG)
        this.svgG.on(".brush", null)
        this.svgG.selectAll(".handle,.overlay,.selection").remove()
        ///this.svgG.selectAll('rect').remove()
        this.svgG.attr('pointer-events', null)
        this.brush = null;

    }

    /**
     * Start the brush tool
     */
    startBrush() {

        if (this.brush) {
            //console.log("Exists")
            return;
        }

        this.brush = d3.brush()
        this.svgG
            // Add the brush feature using the d3.brush function
            .call(this.brush
                // initialise the brush area: 
                //   tolerate 100px outside the image size on the top left part
                //       and finishes at width,height of the image at bottom right part with 100px as an offset
                .extent([[-100, -100], [this.image.naturalWidth + 100, this.image.naturalWidth + 100]])
                .on("start brush", () => {
                    //console.log('start Brsuh')
                    this.extent = d3.event.selection
                    if (this.extent != null) {
                        //console.log(this.extent)
                        this.svgG.selectAll("circle").classed("selected", (d) => {
                            return this.isBrushed(this.extent, (d.x), (d.y))
                        })
                        //console.log(this.svgG.append('g').selectAll("dot"))
                    }
                }))
        this.svgG.on('contextmenu', d3.contextMenu(this.dynamicMenu));
        this.svgG.selectAll('circle').on('contextmenu', d3.contextMenu(this.menu));
    }

    /**
     * Add aoi on the screen
     */ 
    addAoi() {

        this.currentAOI = properties.getCurrentAOI()

        //Track AOI - tracking the last aoi
        //If there isn't any aoi in the array then we create the first one
        this.trackAOI = this.currentAOI.slice(-1)[0]
        console.log(this.trackAOI)

        /**
         * Check if this is the first aoi to be created 
         */
        if (this.trackAOI) {
            this.newName = 'aoi' + (this.trackAOI.id + 1)
            this.newId = this.trackAOI.id + 1
        } else {
            this.newName = 'aoi1'
            this.newId = 1
        }

        this.aoiObject = new AOI(properties.image)

        /**
         * The selection coordinates from the brush 
         */
        this.topSelection = this.extent[0][1]
        this.leftSelection = this.extent[0][0]
        this.bottomSelection = this.extent[1][1]
        this.rightSelection = this.extent[1][0]
        this.heightSelection = this.bottomSelection - this.topSelection
        this.widthSelection = this.rightSelection - this.leftSelection

        /**
         * Start to draw the AOI on top of the image
         */
        this.drawAOI(this.newId, this.newName, this.widthSelection, this.heightSelection, this.leftSelection, this.topSelection)

        /**
         * Mark all the dots under the AOI
         */
        this.svgG.selectAll("circle").classed("underAoi", (d) => {
            return this.isBrushed(this.extent, (d.x), (d.y))
        })

        //console.log(this.currentAOI)

        if (!this.currentAOI) {
            this.tempArray = [this.aoiObject]
            properties.aoi.set(properties.image, this.tempArray)
        } else {
            this.currentAOI.push(this.aoiObject)
            properties.aoi.set(properties.image, this.currentAOI)
        }

        this.aoiObject.setSelection(this.leftSelection, this.topSelection, this.rightSelection, this.bottomSelection, this.newId)
    }


    drawAOI(id, name, widthSelection, heightSelection, leftSelection, topSelection) {

        this.rect = this.svgG.append('g').attr('id', id).classed('aoi', true)
            .classed(name, true)

        this.svgG.selectAll(".handle,.overlay,.selection").raise()


        this.rect.append('rect')
            .classed('aoi', true)
            .classed(name, true)
            .attr('width', widthSelection)
            .attr('height', heightSelection)
            .attr('x', leftSelection)
            .attr('y', topSelection)
            .attr('opacity', 0.5)
            .attr('fill', '#878787')
            .attr('z-index', 1)
            .on('mouseover', function () {
                d3.select(this)
                    .classed('ontop', true)
                    .transition().duration(250).style('fill', '#0f2fff');

            })
            .on('mouseout', function () {
                d3.select(this)
                    .classed('ontop', false)
                    .transition().duration(250).style('fill', '#878787');
            })


        this.rect.append('text')
            .attr('x', leftSelection + 5)
            .attr('y', topSelection + 27)
            //.attr('alignment-baseline','middle')
            //.attr('text-anchor','middle')
            .style('fill', 'white')
            .attr('font-size', '30px')
            .text(name.toUpperCase())

    }

    deleteAOI(object) {

        this.svgG.selectAll('.' + object.classList[1]).remove()
        console.log('selected object', object)

        this.newAOI = []

        this.currentAOI = properties.getCurrentAOI()
        this.currentAOI.forEach(aois => {
            console.log('aoi' + aois.id, object.classList[1])
            if ('aoi' + aois.id !== object.classList[1]) {
                this.newAOI.push(aois)
                console.log('add')
                console.log('The object ->>', aois.object)
            }
            properties.aoi.set(properties.image, this.newAOI);
            this.sync();
        });
    }

    sync() {
        for (let listener of properties.onchange.get('sync').values())
            listener();
    }

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

        console.log('removed')
    }

    hideUser(user) {
        this.svg.selectAll('#' + user).attr('visibility', 'hidden')
    }

    showUser(user) {
        this.svg.selectAll('#' + user).attr('visibility', 'visible')
    }

}