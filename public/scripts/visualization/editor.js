/**
 * Class used for the editor visualization
 */
class Editor extends Visualization {

    /**
     * The constructor for maintating the whole visualization
     * @param {The box containing the visualization} box 
     */
    constructor(box) {

        super(box, 'AOI Editor');

        this.margin = { top: 30, right: 20, bottom: 30, left: 50 }
        this.width = this.box.inner.clientWidth
        this.height = this.box.inner.clientHeight
        //this.aoiCount = 0;
        //this.aoiMap = new Map()

        this.img = new Image();
        this.img.onload = () => {
            this.ratio = 0;
            this.draw();
        }

        /**
         * Create the svg insde the box
         */
        this.svg = d3.select(this.box.inner)
            .classed("smalldot ", true)
            .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .style('position', 'relative')

        //G stands for Graphic

        /**
        * Create the object for the zoom
        * We create an element as we later are going to modify this element
        */
        this.zoom = d3.zoom()

        /**
         * Create the graphic element for all the visualization
         * In here we also append the zoom function
         */
        this.svgG = this.svg
            .call(this.zoom.on("zoom", () => {
                this.svgG.attr("transform", d3.event.transform)
            }))
            .append("g")

        this.svgGdots = this.svgG.append('g')

        /**
         * We filter the zoom function as it usually binds 
         * mouse left click as Pan tool
         * However, that conflicts with the brush, therefore we forward
         * the function to the mouse wheel for zooming in and out
         * and mouse wheel click for the Pan tool
         */
        this.zoom.filter(function () {
            switch (d3.event.type) {
                case "mousedown": return d3.event.button === 1
                case "wheel": return d3.event.button === 0
                default: return false
            }
        })


        /**
         * This is used for maintaing the windows size 
         * Instead we could also use an event listener
         */
        this.timer = setInterval(() => {
            if (this.width !== this.box.inner.clientWidth || this.height !== this.box.inner.clientHeight) {
                this.width = this.box.inner.clientWidth
                this.height = this.box.inner.clientHeight
                console.log("Size: " + this.box.inner.clientHeight, this.box.inner.clientWidth)
                this.redraw();
            }
        }, 100);

        /**
         * create an image element just to load the image from the server
        */

        properties.onchange.set('editor', () => {
            if (this.img.src)
                if (this.img.src.match('([^\/]+$)')[0] === properties.image) return;
            this.img.src = properties.image ? '/testdataset/images/' + properties.image : '';
        })

        if (properties.image)
            this.img.src = '/testdataset/images/' + properties.image;
            
        this.draw();

        this.clearAllAoiMenu = {
            title: 'Clear all AOIs',
            action: () => {
                this.svgGdots.selectAll('.aoi').remove()
                this.svgG.selectAll('circle').classed('underAoi', false)
            }
    
        }

        this.devOptions = [
            {
                divider: true
            },
            {
                title: 'DevOptions',
            },
            {
                title: 'Get Current AOIs from properties',
                action: () => console.log(properties.getCurrentAOI())
            },
            {
                title: 'Get AOIs count',
                action: () => console.log(properties.getCurrentAOIsize())
            },
            {
                title: 'Get Properties Image',
                action: () => console.log(properties.image)
            },

        ]

        this.menu = [
            {
                title: 'Enable Brush',
                action: () => this.startBrush()
            },
            this.clearAllAoiMenu,
            {
                divider: true
            },
            {
                title: 'Fixation info',
                //action: (elemt, d, i) => console.log('The data for this circle is: ' + d)
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
            ...this.devOptions

        ]


        this.menu2 = () => {

            let addAoiMenu = {
                title: 'Add AOI',
                action: () => this.addAoi()
            }

            let result = []

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
                result.push({
                    title: 'Enable Brush',
                    action: () => this.startBrush()
                })
            }
            result.push(this.clearAllAoiMenu)
            result.push(...this.devOptions)

            return result
        };
    }

    /**
     * Updates the image as soon as the editor panel sends the command
     */
    updateImage() {
        this.img.setAttribute('src', properties.image ? '/testdataset/images/' + properties.image : '');
        // this.canvas.width = 0;//this.img.naturalWidth;
        // this.canvas.height = 0;//this.img.naturalHeight;
        //console.log('width: ' + this.img.naturalWidth + ' height: ' + this.img.naturalHeight);
    }

    /**
     * Draws the visualization
     */
    draw() {

        /**
         * Clear the previous drawing
         */
        //this.clearBrush()
        this.svgG.selectAll("*").remove();
        this.clearBrush()

        if (!properties.image) {
            console.log("leaving editor drawing===>")
            return;
        }

        console.log("==>entering on editor drawing")

        /**
         * Scale the points
         */
        let x = d3.scaleLinear().range([0, this.width]);
        let y = d3.scaleLinear().range([0, this.height]);
        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();

        //console.log(this.img)
        //console.log(this.svgG.append('svg:image'))

        /**
         * Attach the image to the background of svg
         */
        this.svgG.append('svg:image')
            .attr('xlink:href', this.img.src)
            .attr('x', this.left)
            .attr('y', this.top)
            .attr('width', this.naturalWidth)
            .attr('height', this.naturalHeight)
        console.log(this.svgG.append('svg:image'))

        /**
         * The loop for displaying the dots and the paths
         */
        scanPaths.forEach(scanPath => {

            const points = scanPath.getPoints();

            x.domain([0, d3.max(points, function (d) { return d.x })]);
            y.domain([0, d3.max(points, function (d) { return d.y })]);

            this.lineFunction = d3.line()
                .x(function (d) {
                    return d.x;
                })
                .y(function (d) {
                    return d.y;
                })

            this.svgG.append("path")
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

            this.svgGdots = this.svgG.append('g')

            this.svgGdots.selectAll("dot")
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


        /**
         * Call the brush
         */
        this.startBrush()

    }
    /**
     * Identify the points under the region
     * @param {The brush coordinates} brush_coords 
     * @param {The data x-coordinate} cx 
     * @param {The data y-coordinate} cy 
     */
    isBrushed(brush_coords, cx, cy) {
        var x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; //Return TRUE or alse
    }

    /**
     * Fix the svg size
     */
    redraw() {

        /**
         * Use the extracted size to set the size of an SVG element.
         */
        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)

    }

    clearBrush() {

        if (!this.brush) {
            console.log("No Brush Exists")
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
     * Maintaining the brush tool
     */
    startBrush() {
        //this.svg.on('.zoom', null);

        if (this.brush) {
            console.log("Exists")
            return;
        }

        this.brush = d3.brush()
        this.svgG
            // Add the brush feature using the d3.brush function
            .call(this.brush
                // initialise the brush area: 
                //   tolerate 100px outside the image size on the top left part
                //       and finishes at width,height of the image at bottim right part with 100px as an offset
                .extent([[-100, -100], [this.img.naturalWidth + 100, this.img.naturalWidth + 100]])
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

        //this.svgG.select('.selection').on('contextmenu', d3.contextMenu(this.menu));
        //this.svgG.selectAll('circle').on('contextmenu', d3.contextMenu(this.menu));
        this.svgG.on('contextmenu', d3.contextMenu(this.menu2));
        this.svgG.selectAll('circle').on('contextmenu', d3.contextMenu(this.menu));
        //console.log(this.brush)
    }

    addAoi() {

        this.aoiCount = properties.aoi.size + 1
        this.name = 'aoi' + this.aoiCount
        this.aoiObject = properties.getCurrentAOI()

        this.top = this.extent[0][1]
        this.left = this.extent[0][0]
        this.bottom = this.extent[1][1] - this.extent[0][1]
        this.right = this.extent[1][0] - this.extent[0][0]
        this.svgGdots.append('rect')
            .classed('aoi', true)
            .classed(this.name, true)
            .attr('width', this.right)
            .attr('height', this.bottom)
            .attr('x', this.left)
            .attr('y', this.top)
            .attr('opacity', 0.5)
            .attr('fill', 'gray')
            .attr('z-index', 1)

        this.svgG.selectAll("circle").classed("underAoi", (d) => {
            return this.isBrushed(this.extent, (d.x), (d.y))
        })
            

        //this.aoiObject.setSelection(this.left, this.top, this.right, this.bottom)
        //this.aoiMap.set(this.name, this.aoiObject)

        this.aoiObject.setSelection(this.left, this.top, this.right, this.bottom)
        properties.aoi.set(this.aoiCount, this.aoiObject)
        //properties.getCurrentAOI().setSelection(this.left, this.top, this.right, this.bottom);
        //this.aoiCount = this.aoiCount + 1

    }






}