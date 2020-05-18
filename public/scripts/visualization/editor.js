class Editor extends Visualization {

    constructor(box) {
        super(box, 'AOI Editor');


        
        this.margin = {top: 30, right: 20, bottom: 30, left: 50}
        this.width = this.box.inner.clientWidth
        this.height = this.box.inner.clientHeight

        this.img = new Image();
        this.img.onload = () => {
            this.ratio = 0;
            this.draw();
        }

        this.svg = d3.select(this.box.inner)   
                .append("svg")
                .attr("width", this.width + this.margin.left + this.margin.right)
                .attr("height", this.height + this.margin.top + this.margin.bottom)
                .style('position', 'relative')
                .call(d3.zoom().on("zoom", () => {
                    this.svg.attr("transform", d3.event.transform)
                 }))
            .append("g")

        this.timer = setInterval(() => {
            if(this.width !== this.box.inner.clientWidth || this.height !== this.box.inner.clientHeight){
                this.width = this.box.inner.clientWidth
                this.height = this.box.inner.clientHeight
                this.draw();
            }
        },100);

        
        
        // create an image element just to load the image from the server
     

        properties.onchange.set('editor', () => {
            this.img.src = properties.image ? '/testdataset/images/' + properties.image : '';
        })

        if(properties.image)
            this.img.src = '/testdataset/images/' + properties.image;
            this.draw();
        }

    updateImage() {
        this.img.setAttribute('src', properties.image ? '/testdataset/images/' + properties.image : '');
        // this.canvas.width = 0;//this.img.naturalWidth;
        // this.canvas.height = 0;//this.img.naturalHeight;
        console.log('width: ' + this.img.naturalWidth + ' height: ' + this.img.naturalHeight);
    }

    draw() {

        this.svg.selectAll("*").remove();

        if (!properties.image){
            console.log("leaving editor drawing===>")
            return;
        }
       
        // Set the dimensions of the canvas / graph
        console.log("==>entering on editor drawing")

        // // Set the ranges
        let x = d3.scaleLinear().range([0, this.width]);
        let y = d3.scaleLinear().range([0, this.height]);
        const imageData = dataset.getImageData(properties.image);
        const scanPaths = imageData.getScanPaths();

        console.log(this.img)
        console.log(this.svg.append('svg:image'))

        this.svg.append('svg:image')
        .attr('xlink:href', this.img.src)
        .attr('x', this.left)
        .attr('y', this.top)
        .attr('width', this.naturalWidth)
        .attr('height', this.naturalHeight)
    

        console.log(this.svg.append('svg:image'))
    
         this.valueline = d3.line()
         .x(function(d) { return x(d.x); })
         .y(function(d) { return y(d.y); });

        
        scanPaths.forEach(scanPath => {
            
            const points = scanPath.getPoints();

            // x.domain([0, d3.select(points, function(d) { return d.x; })]);
            // y.domain([0, d3.select(points, function(d) { return d.y; })]);
            
            //  this.svg.append("path")
            //  .attr("class", "line")
            //  .attr("d", this.valueline(points));

        // Add the scatterplot
        //console.log(this.svg)
        this.svg.append('g').selectAll("dot")
            .data(points)
        .enter().append("circle")
            .attr("r", 20)
            .attr("cx", function(d) { return (d.x); })
            .attr("cy", function(d) { return (d.y); })
            .style("opacity", 0.8)
            .style('fill', '#FF0000')
        });

    }

        redraw() {
    
            // Use the extracted size to set the size of an SVG element.
            this.svg
              .attr("width", this.width)
              .attr("height", this.height);
  
    }



}