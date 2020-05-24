/**
 * Class used for the editor visualization
 */
class TransitionGraph extends Visualization {

    /**
     * The constructor for maintating the whole visualization
     * @param {The box containing the visualization} box 
     */
    constructor(box) {

        super(box, 'Transition Graph (Not working yet)');

        this.margin = { top: 30, right: 20, bottom: 30, left: 50 }
        this.width = this.box.inner.clientWidth
        this.height = this.box.inner.clientHeight

        this.img = new Image();
        this.img.onload = () => {
            this.ratio = 0;
            //this.draw();
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

        /**
         * This is used for maintaing the windows size 
         * Instead we could also use an event listener
         */
        this.timer = setInterval(() => {
            if (this.width !== this.box.inner.clientWidth || this.height !== this.box.inner.clientHeight) {
                this.width = this.box.inner.clientWidth
                this.height = this.box.inner.clientHeight
                //console.log("Size: " + this.box.inner.clientHeight, this.box.inner.clientWidth)
                //this.redraw();
            }
        }, 100);


        properties.onchange.set('transitiongraph', () => {
            if (this.img.src)
                if (this.img.src.match('([^\/]+$)')[0] === properties.image) return;
            this.img.src = properties.image ? '/testdataset/images/' + properties.image : '';
        })

        if (properties.image)
            this.img.src = '/testdataset/images/' + properties.image;
        

        };
    }