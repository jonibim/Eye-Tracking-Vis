/**
 * Class used for the editor visualization
 */
class Editor extends AOIVisualization {

    /**
     * The constructor for maintaining the whole visualization
     * @param {Box} box - The box containing the visualization
     */
    constructor(box) {

        /**
         * the third parameter is used as a identifier for the HTML
         * object so that it can be modified easily from the code
         * Such modifications can be as adding a loader
         */
        super(box, 'AOI Editor', 'editor', 'editor');

        this.clearAllAoiMenu = {
            title: 'Clear all AOIs',
            action: () => {
                properties.removeCurrentAOIs();
                this.sync();
                this.draw();
            }
        };

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

        ];

        this.menu = [
            {
                title: 'Enable Brush',
                action: () => this.enableBrush()
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
            //...this.devOptions

        ];
    }

    /**
     * Draws the visualization
     */
    drawForeground() {
        const imageData = dataset.getImageData(properties.image);
        let scanPaths = imageData.getScanPaths();
        scanPaths = scanPaths.filter(path => properties.users.length ? properties.users.includes(path.person) : true);

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

            this.graphics.append('path')
                .attr('d', this.lineFunction(points))
                .attr('class', 'line')
                .style('stroke-width', 6)
                .style('stroke', 'rgb(6,120,155)')
                .style('fill', 'none')
                .style('opacity', 0.4)
                .on('mouseover', function () {
                    d3.select(this)
                        .transition().duration(250).style('stroke', 'orange');
                })
                .on('mouseout', function () {
                    d3.select(this)
                        .transition().duration(250).style('stroke', 'rgb(6,120,155)');
                });

            this.svgGdots = this.graphics.append('g');

            this.svgGdots.selectAll('dot')
                .data(points)
                .enter().append('circle')
                .attr('r', 20)
                .attr('cx', function (d) { return (d.x); })
                .attr('cy', function (d) { return (d.y); })
                .style('opacity', 0.8)
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

        // TODO maybe add this back or was this removed intentionally?
        // this.graphics.selectAll('circle').on('contextmenu', d3.contextMenu(this.menu));
    }
}