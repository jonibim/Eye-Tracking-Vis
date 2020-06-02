/**
 * Class used for the editor visualization
 */
class TransitionGraph extends Visualization {

    /**
     * The constructor for maintating the whole visualization
     * @param {The box containing the visualization} box 
     */
    constructor(box) {

        /**
		 * the third parameter is used as a identifier for the HTML 
		 * object so that it can be modified easily from the code
		 * Such modicaitons can be as adding a loader 
		 */
        super(box, 'Transition Graph', 'tgviz');

        this.margin = { top: 30, right: 20, bottom: 30, left: 50 }
        this.width = this.box.inner.clientWidth
        this.height = this.box.inner.clientHeight


        this.img = new Image();
        this.img.onload = () => {
            this.ratio = 0;
            this.draw();
            this.center()
        }

        /**
         * Create the svg insde the box
         */
        this.svg = d3.select(this.box.inner)
            .classed("smalldot ", true)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
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

        /**
         * This is used for maintaing the windows size 
         * Instead we could also use an event listener
         */
        this.timer = setInterval(() => {
            if (this.width !== this.box.inner.clientWidth || this.height !== this.box.inner.clientHeight) {
                this.width = this.box.inner.clientWidth
                this.height = this.box.inner.clientHeight
                //console.log("Size: " + this.box.inner.clientHeight, this.box.inner.clientWidth)
                this.redraw()
            }
        }, 100);


        properties.onchange.set('transitiongraph', () => {
            if (this.img.src)
                if (this.img.src.match('([^\/]+$)')[0] === properties.image) return;
            this.img.src = properties.image ? dataset.url + '/images/' + properties.image : '';
        })


        if (properties.image)
            this.img.src = dataset.url + '/images/' + properties.image;

        properties.eventListeners.push(() => this.draw())

    };

    /**
* Draws the visualization
*/
    draw() {

        if (document.getElementById('tgvizloader')) {
            let currentDimmer = document.getElementById('tgvizloader')
            currentDimmer.parentNode.removeChild(currentDimmer)
        }

        let workspace = document.getElementById('tgviz')
        //console.log(workspace)
        let dimmer = document.createElement('div')
        dimmer.classList.add('ui',
            'active', 'dimmer')
        dimmer.setAttribute("style", "z-index:10")
        dimmer.id = 'tgvizloader'
        let loader = document.createElement('div')
        loader.innerHTML = 'Loading Transition Graph'
        loader.classList.add('ui', 'indeterminate', 'text', 'loader')
        dimmer.appendChild(loader);
        workspace.appendChild(dimmer)

        let errorFlag = null


        try {

           
            /**
             * Setting up the loader view
             */

            /**
             * Clear the previous drawing
             */
            //this.clearBrush()
            this.svgG.selectAll("*").remove()

            if (!properties.image) {
                console.log("leaving transition===>")
                return;
            }

            //console.log("==>entering transition")

            const AOIs = properties.getCurrentAOI()
            const imageData = dataset.getImageData(properties.image);
            //const scanPaths = imageData.getScanPaths();

            /**
             * Matrix preperation
             */

            this.dimension = AOIs.length

            if (this.dimension == 0) {
                loader.parentNode.removeChild(loader)
                let content = d3.select(dimmer)
                    .append('div')
                    .attr('class', 'contnet')
                    .append('h2')
                    .attr('class', 'ui inverted icon header')


                content.append('i')
                    .attr('class', 'exclamation icon')

                content.append('div').text('No AOIs.')
                return
            }

            setTimeout(() => {
                if (!errorFlag && dimmer.parentNode) dimmer.parentNode.removeChild(dimmer)
            }, 0);

            this.matrix = Array(this.dimension).fill().map(() => Array(this.dimension).fill(0))

            for (let i = 0; i < this.dimension; i++) {
                for (let j = 0; j < AOIs[i].points.length; j++) {
                    this.pointSource = AOIs[i].points[j]
                    this.pointPerson = this.pointSource.path.person
                    this.pointColor = this.pointSource.path.color
                    this.pointPath = imageData.getScanPaths(this.pointPerson, this.pointColor)[0];
                    this.nextPoint = this.pointPath.getNextPoint(this.pointSource.time)
                    for (let k = 0; k < this.dimension; k++) {
                        if (i === k) continue;
                        if (AOIs[k].points.includes(this.nextPoint)) {
                            this.matrix[i][k]++
                        }
                    }
                }
            }

            console.log('The Matrix', this.matrix)
            //console.log(this.matrix.flatMap((row, rowIndex) => row.map((e, colIndex) => { })))

            let _nodes = []
            let _links = []

            for (let i = 0; i < this.dimension; i++) {
                var AOIname = 'aoi' + AOIs[i].id
                _nodes.push({ "id": AOIname })
                for (let j = 0; j < this.dimension; j++) {
                    if (this.matrix[i][j] !== 0) {
                        var AOIname2 = 'aoi' + AOIs[j].id
                        _links.push({ 'source': AOIname, 'target': AOIname2 })
                    }
                }
            }


            const links = _links.map(d => Object.create(d));
            const nodes = _nodes.map(d => Object.create(d));

            console.log('Links',links)
            console.log('Nodes',nodes)

            var drag = simulation => {

                function dragstarted(d) {
                    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                }

                function dragged(d) {
                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                }

                function dragended(d) {
                    if (!d3.event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id))
                .force("charge", d3.forceManyBody().strength(-1000))
                .force("x", d3.forceX())
                .force("y", d3.forceY());


            var color = d3.scaleOrdinal(nodes, d3.schemeCategory10)

            // Per-type markers, as they don't inherit styles.
            this.svg.append("defs").selectAll("marker")
                .data(['end'])
                .join("marker")
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 15)
                .attr("refY", -0.5)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("fill", color)
                .attr("d", "M0,-5L10,0L0,5");

            const link = this.svgG
                .selectAll("path")
                .data(links)
                .join("path")
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("stroke", d => color(d.target))
                .attr("marker-end", "url(#end)");

            const node = this.svgG
                .selectAll("g")
                .data(nodes)
                .join("g")
                .attr("fill", "currentColor")
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .call(drag(simulation));

            node.append("circle")
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)
                .attr("r", 4);

            node.append("text")
                .attr("x", 8)
                .attr("y", "0.31em")
                .text(d => d.id.toUpperCase())
                .clone(true).lower()
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-width", 3);

            simulation.on("tick", () => {
                link.attr("d", linkArc);
                node.attr("transform", d => `translate(${d.x},${d.y})`);
            });

            //invalidation.then(() => simulation.stop());

            function linkArc(d) {
                const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
                return `
              M${d.source.x},${d.source.y}
              A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
            `;
            }

            

            // if (dimmer.parentNode) dimmer.parentNode.removeChild(dimmer)
        }
        catch (err) {

            errorFlag = 1

            loader.parentNode.removeChild(loader)
            let content = d3.select(dimmer)
                .append('div')
                .attr('class', 'contnet')
                .append('h2')
                .attr('class', 'ui red icon header')


            content.append('i')
                .attr('class', 'exclamation circle icon')

            content.append('div').text(err.message)

        }

        
    }

    onRemoved() {
        if(this.timer)
            clearInterval(this.timer);
    }

           /**
     * Centers the attention map on the box
     */
    center(){
        if(this.width === 0 || this.height === 0)
            return;
        this.svg.call(this.zoom.translateTo, 100 , 0);
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
}
