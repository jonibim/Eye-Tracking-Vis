/*
    Eye Cloud visualization
 */

class EyeCloud extends Visualization {
    constructor(box) {
        super(box, 'Eye Cloud');

        const width = window.innerWidth; // Width of the web page inside the browser
        const height = window.innerHeight; // Height of the web page inside the browser

        const map = 1;

        const range = 150;
        const minRadius = 10;
        const maxRadius = 100;

        // Create an svg- and g-tag inside the graph class
        let svg = d3.select('.graph')
            .append('svg')
            .attr('width', '100%') // Full screen
            .attr('height', '100%') // Full screen
            .append('g')
            .attr('transform', 'translate(0,0)');

        // Create a defs-tag inside the svg-tag
        d3.select('svg')
            .append('defs');

        // We must load the dataset as a tsv, since its values are separated by tabs, not commas
        d3.tsv('/testdataset/all_fixation_data_cleaned_up.csv').then( function (data) {
            let dataByCity = d3.nest().key(function (data) { // Nest the data by StimuliName
                return data.StimuliName;
            }).entries(data);

            let mapObject = {}; // Object that contains the images of the maps
            for (var i = 0; i < dataByCity.length; i++) {
                mapObject[i] = Object.values(dataByCity)[i]['key'];
            }

            console.log('Selected map: ' + mapObject[map]);

            // Generate the coordinate objects
            let coordinates = []; // Array of all the coordinates for the selected map
            dataByCity[map]['values'].forEach(function (element) {
                let x_coordinate = parseInt(element.MappedFixationPointX);
                let y_coordinate = parseInt(element.MappedFixationPointY);
                // Coordinates require the co_x and co_y tags in stead of just x and y to prevent issues with the
                // x and y locations of the circles of the graph
                coordinates.push({co_x: x_coordinate, co_y: y_coordinate});
            });

            console.log(coordinates);

            // Generate an array of 'density scores' for each coordinate
            let densityScores = [];
            for (let i = 0; i < coordinates.length; i++) {
                densityScores[i] = {c_index: i, density: 0}; // Set density of the coordinate to zero
                for (let j = 0; j < coordinates.length; j++) {
                    // Calculate distance between points
                    let xDistance = Math.pow(coordinates[j].co_x - coordinates[i].co_x, 2);
                    let yDistance = Math.pow(coordinates[j].co_y - coordinates[i].co_y, 2);
                    let distance = Math.sqrt(xDistance + yDistance);
                    // If point j is within the radius of or close to point i and not too close
                    if (distance <= range) {
                        densityScores[i].density++;
                    }

                }
            }

            // Sort the density scores in a descending order
            densityScores = densityScores.sort((a, b) => b.density - a.density); // Descending sort

            console.log(densityScores)

            // Find close coordinates to the coordinates with the highest density scores
            // and remove these coordinates from the coordinates list. Also, save the densities.
            // We do this, because the coordinate with the highest density score has the highest priority.
            let newCoordinates = []; // final coordinates that will be used to generate the circles
            let densities = []; // the density of each coordinate in newCoordinates
            for (let i = 0; i < densityScores.length; i++) {
                for (let j = 0; j < coordinates.length; j++) {
                    let xDistance = Math.pow(coordinates[j].co_x - coordinates[densityScores[i].c_index].co_x, 2);
                    let yDistance = Math.pow(coordinates[j].co_y - coordinates[densityScores[i].c_index].co_y, 2);
                    let distance = Math.sqrt(xDistance + yDistance);
                    // If coordinate at j is inside of the radius of coordinate at i and not the same coordinate
                    if (distance <= range && densityScores[i].c_index != j) {
                        // Remove the coordinate with the index that is in the range of the coordinate at i
                        densityScores = densityScores.filter(function (e) { return e.c_index != j})
                    }
                }
                newCoordinates.push(coordinates[densityScores[i].c_index]);
                densities.push(densityScores[i].density);
            }

            console.log(newCoordinates);
            console.log(densities);

            let densityMax = Math.max.apply(Math, densities); // the maximum value in the densities array
            let densityMin = Math.min.apply(Math, densities); // the minimum value in the densities array
            let radiusScale = d3.scaleSqrt().domain([densityMin, densityMax]).range([minRadius, maxRadius]);

            // For every element in newCoordinates create a circle with the necessary attributes
            let radiusCount = -1; // Keeps track of the index of the densities array
            let circleCount = -1; // Keeps track of the circle number
            let mapCount = -1; // Local variable that counts the number of maps of the circles
            let circles = svg.selectAll('.artist')
                .data(newCoordinates)
                .enter().append('circle')
                //.attr('class', 'artist')
                .attr('id', function () {
                    circleCount++;
                    return 'circle_' + circleCount;
                })
                .attr('cx', width / 2)
                .attr('cy', height / 2)
                .attr('r', function () {
                    radiusCount++;
                    return radiusScale(densities[radiusCount]);
                })
                .attr('stroke', 'black')
                .attr('fill', function () {
                    mapCount++;
                    return 'url(#map_c' + mapCount + ')';
                })

            // Collection of forces that dictate where the circles should go
            // and how we want them to interact
            let collisionCount = -1; // Keeps track of the index of the densities array
            let simulation = d3.forceSimulation()
                .force('x', d3.forceX(width / 2).strength(0.045))
                .force('y', d3.forceY(height / 2).strength(0.095))
                .force('collide', d3.forceCollide(function () {
                    collisionCount++;
                    return radiusScale(densities[collisionCount]) + 2;
                }))

            // For each (new) coordinate object, create a pattern that contains the coordinates
            for (let i = 0; i < newCoordinates.length; i++) {
                let circleRadius = document.getElementById('circle_' + i.toString()).getAttribute('r');
                d3.select('defs')
                    .append('pattern')
                    .attr('id', 'map_c' + i) // Create id with the index of each object in the data
                    .attr('width', 1)
                    .attr('height', 1)
                    .append('image')
                    // Image coordinates have to be negated
                    // and the radius is taken into account to center the coordinate
                    .attr('x', -newCoordinates[i].co_x + parseInt(circleRadius))
                    .attr('y', -newCoordinates[i].co_y + parseInt(circleRadius))
                    .attr('xlink:href', '/testdataset/images/' + mapObject[map]);
            }

            // Make the stroke of the most frequently viewed area red
            d3.select('#circle_0')
                .attr('stroke', 'red')

            // On every tick during the simulation, call the update function
            simulation.nodes(newCoordinates)
                .on('tick', update);

            // Automatically update the location of each circle
            function update() {
                circles
                    .attr('cx', function (d) {
                        return d.x;
                    })
                    .attr('cy', function (d) {
                        return d.y;
                    })
            }
        });
    }
}