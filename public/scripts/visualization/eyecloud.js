/*
    Eye Cloud visualization
 */

class EyeCloud extends Visualization {
    constructor(box) {
        super(box, 'Eye Cloud');

        this.img = new Image();
        this.zoom = d3.zoom();

        const width = box.inner.clientWidth; // Width of the box
        const height = box.inner.clientHeight; // Height of box

        const range = 150;
        const minRadius = 10;
        const maxRadius = 100;

        let radiusScale; // scale that determines the size of the radii

        let allCoordinates = []; // set of all the coordinates of an image in the dataset
        let densityScores = [];
        let coordinates = []; // final coordinates that will be used to generate the circles
        let densities = []; // the density of each coordinate in the coordinates array

        let drawing = false; // Boolean that is true when the eye cloud is being drawn

        let clickedObject; // Holds the object that is being right clicked

        let menu = [
            {
                title: 'Show info',
                action: function() {
                    getInfo(clickedObject);
                    console.log('eyecloud.js - Showing info...');
                }
            },
            {
                title: 'Disable circle',
                action: function () {
                    disableCircle(clickedObject);
                    console.log('eyecloud.js - Disabling circle...');
                }
            },
            {
                title: 'Enable all circles',
                action: function () {
                    enableCircles();
                    console.log('eyecloud.js - Enabling all circles...');
                }
            },
            {
                title: 'Center visualization',
                action: function () {
                    // This code fits the eye cloud by height
                    let bWidth = box.inner.clientWidth / 4;
                    let bHeight = box.inner.clientHeight / 4;
                    d3.select('#cloud_group')
                        .attr('transform', 'translate(' + bWidth + ',' + bHeight + ') scale(0.5)');
                    console.log('eyecloud.js - Centering visualization...');
                }
            },
            {
                title: 'Save image',
                action: function () {
                    saveImage();
                    console.log('Saving image...');
                }
            }
        ];

        /**
         * Create an svg- and g-tag inside the graph class
         */
        let svg = d3.select(box.inner)
            .classed('smalldot', true)
            .append('svg')
            .attr('id', 'cloud_svg')
            .attr('width', width) // Full screen
            .attr('height', height) // Full screen
            .call(this.zoom.on('zoom', function () {
                svg.attr('transform', d3.event.transform)
            }))
            .append('g')
            .attr('id', 'cloud_group')
            .attr('transform', 'translate(0,0)')
            .attr('oncontextmenu', 'log()');

        /**
         * Create a defs-tag inside the svg-tag
         */
        d3.select('#cloud_svg')
            .append('defs')
            .attr('id', 'pattern_defs');

        /*
        // Sets default zoom on load (does not work properly)
        svg.call(this.zoom.scaleTo, 0.5);
        svg.call(this.zoom.translateTo, 3 * (width / 4), 2 * (height / 4));
         */

        /**
         * Upon any change of the properties class, check what settings have changed
         * and apply the new settings to the visualization
         */
        properties.onchange.set('eyecloud', () => {
            if (this.img !== properties.image) { // If the image has been changed
                this.img = properties.image;
                //disabledCircles = [];
                if (!drawing) {
                    drawing = true;
                    generateData(dataset.getImageData(properties.image));
                    draw();
                    //this.center();
                }
            }
        });

        /**
         * Generate the necessary data for the eye cloud visualization
         */
        function generateData(imageData) {
            allCoordinates = [];
            imageData.scanpaths.forEach(function (user) {
                user.points.forEach(function (point) {
                    allCoordinates.push({co_x: parseInt(point.x), co_y: parseInt(point.y)});
                })
            });

            //console.log(coordinates);

            /**
             * Generate an array of 'density scores' for each coordinate
             */
            densityScores = [];
            for (let i = 0; i < allCoordinates.length; i++) {
                densityScores[i] = {c_index: i, density: 0}; // Set density of the coordinate to zero
                for (let j = 0; j < allCoordinates.length; j++) {
                    // Calculate distance between points
                    let xDistance = Math.pow(allCoordinates[j].co_x - allCoordinates[i].co_x, 2);
                    let yDistance = Math.pow(allCoordinates[j].co_y - allCoordinates[i].co_y, 2);
                    let distance = Math.sqrt(xDistance + yDistance);
                    // If point j is within the radius of or close to point i and not too close
                    if (distance <= range) {
                        densityScores[i].density++;
                    }

                }
            }

            /**
             * Sort the density scores in a descending order
             */
            densityScores = densityScores.sort((a, b) => b.density - a.density); // Descending sort

            //console.log(densityScores);

            /**
             * Find close coordinates to the coordinates with the highest density scores
             * and remove these coordinates from the coordinates list. Also, save the densities.
             * We do this, because the coordinate with the highest density score has the highest priority.
             */
            coordinates = [];
            densities = [];
            for (let i = 0; i < densityScores.length; i++) {
                for (let j = 0; j < allCoordinates.length; j++) {
                    let xDistance = Math.pow(allCoordinates[j].co_x - allCoordinates[densityScores[i].c_index].co_x, 2);
                    let yDistance = Math.pow(allCoordinates[j].co_y - allCoordinates[densityScores[i].c_index].co_y, 2);
                    let distance = Math.sqrt(xDistance + yDistance);
                    // If coordinate at j is inside of the radius of coordinate at i and not the same coordinate
                    if (distance <= range && densityScores[i].c_index !== j) {
                        // Remove the coordinate with the index that is in the range of the coordinate at i
                        densityScores = densityScores.filter(function (e) {
                            return e.c_index !== j;
                        })
                    }
                }
                coordinates.push(allCoordinates[densityScores[i].c_index]);
                densities.push(densityScores[i].density);
            }

            //console.log(newCoordinates);
            //console.log(densities);

            // Set the radius scale depending on the maximum and minimum density
            let densityMax = Math.max.apply(Math, densities); // the maximum value in the densities array
            let densityMin = Math.min.apply(Math, densities); // the minimum value in the densities array
            radiusScale = d3.scaleSqrt().domain([densityMin, densityMax]).range([minRadius, maxRadius]);
        }

        /**
         * Draw the eye cloud visualization
         */
        function draw() {
            d3.select('#cloud_group').selectAll('circle').remove(); // Remove already existing circles
            d3.select('#pattern_defs').selectAll('pattern').remove(); // Remove already existing patterns

            /*
            let densityMax = Math.max.apply(Math, densities); // the maximum value in the densities array
            let densityMin = Math.min.apply(Math, densities); // the minimum value in the densities array
            let radiusScale = d3.scaleSqrt().domain([densityMin, densityMax]).range([minRadius, maxRadius]);
             */

            /**
             * For every element in coordinates create a circle with the necessary attributes
             */
            let radiusCount = -1; // Keeps track of the index of the densities array
            let circleCount = -1; // Keeps track of the circle number
            let mapCount = -1; // Local variable that counts the number of maps of the circles
            let circles = svg.selectAll('.artist')
                .data(coordinates)
                .enter().append('circle')
                //.attr('class', 'artist')
                .attr('id', function () {
                    circleCount++;
                    return 'circle_' + circleCount;
                })
                .attr('r', function () {
                    radiusCount++;
                    return radiusScale(densities[radiusCount]);
                })
                .attr('stroke', 'black')
                .attr('fill', function () {
                    mapCount++;
                    return 'url(#map_c' + mapCount + ')';
                });

            /**
             * Collection of forces that dictate where the circles should go
             * and how we want them to interact
             */
            let collisionCount = -1; // Keeps track of the index of the densities array
            let simulation = d3.forceSimulation()
                .force('x', d3.forceX(box.inner.clientWidth / 2).strength(0.045))
                .force('y', d3.forceY(box.inner.clientHeight / 2).strength(0.15))
                .force('collide', d3.forceCollide(function () {
                    collisionCount++;
                    return radiusScale(densities[collisionCount]) + 2;
                }))

            /**
             * For each enabled coordinate object, create a pattern that contains the coordinates
             */
            for (let i = 0; i < coordinates.length; i++) {
                let circleRadius = document.getElementById('circle_' + i.toString()).getAttribute('r');
                d3.select('defs')
                    .append('pattern')
                    .attr('id', 'map_c' + i) // Create id with the index of each object in the data
                    .attr('width', 1)
                    .attr('height', 1)
                    .append('image')
                    // Image coordinates have to be negated
                    // and the radius is taken into account to center the coordinate
                    .attr('x', -coordinates[i].co_x + parseInt(circleRadius))
                    .attr('y', -coordinates[i].co_y + parseInt(circleRadius))
                    .attr('xlink:href', '/testdataset/images/' + properties.image);
            }

            /**
             * Make the stroke of the most frequently viewed area red
             */
            d3.select('#circle_0')
                .attr('stroke', 'red')

            /**
             * Upon right clicking a circle, display a context menu
             * and register the id of the clicked element
             */
            d3.select('#cloud_group').selectAll('circle').on('contextmenu', function (object) {
                clickedObject = object; // set variable to the clicked object
            })
            d3.select('#cloud_group').on('contextmenu', d3.contextMenu(menu));

            /**
             * On every tick during the simulation, call the update function
             */
            simulation.nodes(coordinates)
                .on('tick', update);

            /**
             * Automatically update the location of each circle
             */
            function update() {
                circles
                    .attr('cx', function (d) {
                        return d.x;
                    })
                    .attr('cy', function (d) {
                        return d.y;
                    })
            }

            drawing = false; // Reset drawing variable
        }

        /**
         * Display the coordinates and density of the selected circle object with the used range
         */
        function getInfo(object) {
            let x = object.co_x;
            let y = object.co_y;
            let density = densities[object.index];

            let message = 'This circle represents point (' + x + ', ' + y + ') on the image.\n' +
                'There are ' + density + ' other points in a range of ' + range + ' pixels to this point.';

            alert(message);
        }

        /**
         * Disables circle by remove it from the coordinates array and removing its density
         */
        function disableCircle(object) {
            // Remove selected circle from the coordinates array
            coordinates = coordinates.filter(coordinate => coordinate.index !== object.index);
            // Remove density that belongs to the removed circle
            densities.splice(object.index, 1);
            draw(); // Redraw
        }

        /**
         * Enables are circles again by regenerating the data
         */
        function enableCircles() {
            generateData(dataset.getImageData(properties.image)); // Regenerate all coordinates
            draw(); // Redraw
        }

        function saveImage() {
            // COMING SOON!
        }
    }
}