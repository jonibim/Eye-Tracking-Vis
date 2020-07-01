/**
    Eye Cloud visualization
 */

class EyeCloud extends Visualization {
    constructor(box) {
        super(box, 'Eye Cloud', 'eyecloudviz');

        this.svg; // Holds the svg-object of the visualization
        this.zoom = d3.zoom();
        this.zoom.scaleExtent([0.1,5]); // Sets limit of the zoom's scale

        let width = box.inner.clientWidth; // Width of the box
        let height = box.inner.clientHeight; // Height of the box

        let range = 150; // Default is 150.
        let minRadius = 10; // Default is 10.
        let maxRadius = 100; // Default is 100.
        let maxCircles = 100; // Default is 100.

        let strokeColor = 'red'; // color of the stroke of the most frequently viewed circle. Default color is red
        let radiusScale; // scale that determines the size of the radii

        let allCoordinates = []; // set of all the coordinates of an image in the dataset
        let densityScores = [];
        let coordinates = []; // final coordinates that will be used to generate the circles
        let densities = []; // the density of each coordinate in the coordinates array

        let drawing = false; // Boolean that is true when the eye cloud is being drawn
        let enabledDisabled = false; // Boolean that is true when the circles has been enabled or disabled

        let simulation; // Holds the force simulation object
        let clickedObject; // Holds the object that is being right clicked

        let thisClass = this; // To allow for a call to this class inside nested functions

        // Context menu items
        let infoMenuItem;
        let showAreaMenuItem;
        let disableMenuItem ;
        let generalMenuItems;
        let menu; // Default context menu
        let circleMenu; // Context menu for the circles

        setContextMenus(); // Initialize the context menu items

        /**
         * Create an svg- and g-tag inside the box.
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
            .attr('transform', 'translate(0,0)');

        /**
         * Create a defs-tag inside the svg-tag.
         */
        d3.select('#cloud_svg')
            .append('defs')
            .attr('id', 'pattern_defs');

        /**
         * Replace standard d3.zoom bindings with mouse wheel for zooming in and out
         * and mouse wheel click for the Pan tool.
         */
        this.zoom.filter(() =>
            (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));

        /**
         * Upon any change of the properties class, check what settings have changed
         * and apply the new settings to the visualization.
         */
        properties.setListener('eyecloud', 'image', event => {
            toggleDimmer(false); // Turn dimmer off
            removeAreaGroup();

            if (!drawing) { // If we are not already drawing the eye cloud
                drawing = true;
                generateData(dataset.getImageData(properties.image));
                $('.eyecloud_info').toast('close') // Close popups
                draw();
            }
        });
        properties.setListener('eyecloud', 'users', event => {
            if (properties.users.length <= 0) { // If no users are selected
                toggleDimmer(true); // Turn dimmer on
            } else {
                toggleDimmer(false); // Turn dimmer off
            }

            removeAreaGroup();

            if (!drawing) { // If we are not already drawing the eye cloud
                drawing = true;
                generateData(dataset.getImageData(properties.image));
                $('.eyecloud_info').toast('close') // Close popups
                draw();
            }
        });
        properties.setListener('eyecloud', 'color', event => {
            strokeColor = properties.getColorHex(); // set global color variable
            setColor(properties.getColorHex());
        });
        properties.setListener('eyecloud', 'ec', event => {
            let ecProperties = properties.getCurrentECSliders();
            range = ecProperties[0];
            minRadius = ecProperties[1];
            maxRadius = ecProperties[2];
            maxCircles = ecProperties[3];

            removeAreaGroup();

            if (!drawing) { // If we are not already drawing the eye cloud
                drawing = true;
                generateData(dataset.getImageData(properties.image));
                draw();
            }
        });

        /**
         * Workaround to draw visualization when turned off an on.
         */
        if (properties.image) {
            generateData(dataset.getImageData(properties.image));
            draw();
        }

        /**
         * Resizing the visualizations.
         */
        this.timer = setInterval(() => {
            if (width !== box.inner.clientWidth || height !== box.inner.clientHeight) {
                width = box.inner.clientWidth;
                height = box.inner.clientHeight;
                resize();
                if (!drawing) { // If we are not already drawing
                    drawing = true;
                    draw(); // Redraw to recenter the visualization and prevent issues with centering
                }
            }
        }, 100);

        /**
         * Generate the necessary data for the eye cloud visualization.
         */
        function generateData(imageData) {
            allCoordinates = [];
            imageData.scanpaths.forEach(function (user) {
                if (properties.users.includes(user.person)) { // For every selected user, get the coordinates
                    user.points.forEach(function (point) {
                        allCoordinates.push({co_x: parseInt(point.x), co_y: parseInt(point.y)});
                    })
                }
            });

            //console.log(allCoordinates);

            /**
             * Generate an array of 'density scores' for each coordinate.
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
             * Sort the density scores in a descending order.
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
                if (i < maxCircles) { // Check if amount of circles has been reached
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
                } else {
                    break; // Break if the maximum amount of circles has been reached
                }
            }

            //console.log(coordinates);
            //console.log(densities);

            // Set the radius scale depending on the maximum and minimum density
            let densityMax = Math.max.apply(Math, densities); // the maximum value in the densities array
            let densityMin = Math.min.apply(Math, densities); // the minimum value in the densities array
            radiusScale = d3.scaleSqrt().domain([densityMin, densityMax]).range([minRadius, maxRadius]);
        };

        /**
         * Draw the eye cloud visualization.
         */
        function draw() {
            d3.select('#cloud_group').selectAll('circle').remove(); // Remove already existing circles
            d3.select('#pattern_defs').selectAll('pattern').remove(); // Remove already existing patterns

            /**
             * For every element in coordinates create a circle with the necessary attributes.
             */
            let radiusCount = -1; // Keeps track of the index of the densities array
            let circleCount = -1; // Keeps track of the circle number
            let mapCount = -1; // Local variable that counts the number of maps of the circles
            let circles = svg.selectAll('.artist')
                .data(coordinates)
                .enter().append('circle')
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
             * and how we want them to interact.
             */
            let collisionCount = -1; // Keeps track of the index of the densities array
            simulation = d3.forceSimulation()
                .force('x', d3.forceX(box.inner.clientWidth / 2).strength(0.045))
                .force('y', d3.forceY(box.inner.clientHeight / 2).strength(0.15))
                .force('collide', d3.forceCollide(function () {
                    collisionCount++;
                    return radiusScale(densities[collisionCount]) + 2;
                }))

            /**
             * For each enabled coordinate object, create a pattern that contains the coordinates.
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
                    .attr('xlink:href', dataset.url + '/images/' + properties.image);
            }

            /**
             * Make the stroke of the most frequently viewed area the color of the global color variable and thicker.
             */
            d3.select('#circle_0')
                .attr('stroke', strokeColor)
                .attr('stroke-width', 2);

            /**
             * Upon a right click, display a context menu
             * and, if necessary, register the id of the clicked element.
             */
            d3.select('#cloud_svg').on('contextmenu', d3.contextMenu(menu));
            d3.select('#cloud_group').on('contextmenu', d3.contextMenu(circleMenu));
            d3.select('#cloud_group').selectAll('circle').on('contextmenu', function (object) {
                clickedObject = object; // Store object that is being right clicked
            });

            d3.select('#cloud_group').selectAll('circle').on('click', function (object) {
                clickedObject = object; // Store object that is being left clicked
            });
            // Assigning the show area functionality to a left click on a circle
            d3.select('#cloud_group').on('click', function () {
                showArea();
            });

            /**
             * On every tick during the simulation, call the update function.
             */
            simulation.nodes(coordinates)
                .on('tick', update);

            /**
             * Automatically update the location of each circle.
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

            thisClass.svg = d3.select('#cloud_svg'); // Update the svg property of the visualization
            if (!enabledDisabled) { // If a circle hasn't been enabled or disabled
                thisClass.setDefaultScale(); // Set the default scale after drawing the eye cloud
            };

            enabledDisabled = false; // Reset boolean
            drawing = false; // Reset drawing variable
        };

        /**
         * Initialize the context menu items and context menus itself.
         */
        function setContextMenus() {
            infoMenuItem = {
                title: 'Show info',
                action: function() {
                    getInfo(clickedObject);
                }
            };

            showAreaMenuItem = {
                title: 'Show area on map',
                action: function () {
                    showArea();
                }
            };

            disableMenuItem = {
                title: 'Disable circle',
                action: function () {
                    disableCircle(clickedObject);
                }
            };

            generalMenuItems = [
                {
                    title: 'Enable all circles',
                    action: function () {
                        enableCircles();
                    }
                },
                {
                    divider: true
                },
                {
                    title: 'Open settings tab',
                    action: function () {
                        showEyeCloudSettings(); // Open the settings tab at the eye cloud
                    }
                },
                {
                    title: 'Center visualization',
                    action: function () {
                        thisClass.center();
                    }
                },
                {
                    title: 'Download as image',
                    action: function () {
                        // Display a popup for 7.5 seconds to let the user know, saving takes some time
                        $('.settingHelp')  // Close previous toast
                            .toast('close')
                        $('body')
                            .toast({
                                showIcon: 'info',
                                title: 'Downloading Image',
                                displayTime: 7500,
                                message: 'The eye cloud is being saved as an image. This may take some time.',
                                class: 'warning',
                                position: 'top center',
                                closeIcon: false
                            });
                        downloadSVG(d3.select('#cloud_svg').node(), 'eyecloud');
                    }
                }
            ];

            menu = () => {
                let result = [];

                result.push(infoMenuItem);
                result[0].disabled = true;
                result.push(showAreaMenuItem);
                result[1].disabled = true;
                result.push(disableMenuItem);
                result[2].disabled = true;

                generalMenuItems.forEach(function (object) {
                    result.push(object);
                })

                return result;
            };

            circleMenu = () => {
                let result = [];

                result.push(infoMenuItem);
                result[0].disabled = false;
                result.push(showAreaMenuItem);
                result[1].disabled = false;
                result.push(disableMenuItem);
                result[2].disabled = false;

                generalMenuItems.forEach(function (object) {
                    result.push(object);
                })

                return result;
            };
        };

        /**
         * Toggle a dimmer that covers the inner box with the appropriate Fomantic-UI icons.
         */
        function toggleDimmer(onof) {
            if (onof) { // Turn dimmer on
                let box = document.getElementById('eyecloudviz');
                let dimmer = document.createElement('div');
                dimmer.classList.add('ui', 'active', 'dimmer');
                dimmer.setAttribute("style", "z-index:10")
                dimmer.id = 'eyecloud_dimmer';
                box.appendChild(dimmer);

                let content = d3.select(dimmer)
                    .append('div')
                    .attr('class', 'content')
                    .append('h2')
                    .attr('class', 'ui inverted icon header');

                let i_class = content.append('i')
                    .attr('class', 'icons');

                i_class.append('i')
                    .attr('class', 'big users icon');
                i_class.append('i')
                    .attr('class', 'huge grey dont icon');

                content.append('br'); // Prevents overlapping of the huge icon
                content.append('br'); // Prevents overlapping of the huge icon
                content.append('div').text('No users selected');
                content.append('div').attr("style","font-size: 12px")
                    .html("<a onclick='showUserSettings()'>Check the users setting in the settings tab for adding a user<\a>");
            } else { // Turn dimmer off
                if (!! document.getElementById('eyecloud_dimmer')) {
                    document.getElementById('eyecloud_dimmer').remove(); // Remove the dimmer, if it exists
                }
            }
        };

        /**
         * Set the stroke color of the largest circle and the area circle, if it's visible.
         */
        function setColor() {
            d3.select('#circle_0')
                .attr('stroke', properties.getColorHex());

            d3.select('#area_circle')
                .attr('stroke', properties.getColorHex());
            d3.select('#area_cloud')
                .attr('stroke', properties.getColorHex());
        };

        /**
         * Display the coordinates and density of the selected circle object with the used range.
         */
        function getInfo(object) {
            let x = object.co_x;
            let y = object.co_y;
            let density = densities[object.index] - 1;

            let densityVerb;
            let pointOrPoints;
            if (density === 0) {
                densityVerb = 'is';
                density = 'no';
                pointOrPoints = 'point';
            } else if (density === 1) { // If there is only one other point close, adjust the message to singular
                densityVerb = 'is';
                pointOrPoints = 'point';
            } else {
                densityVerb = 'are';
                pointOrPoints = 'points';
            }

            let message = 'This circle represents point (' + x + ', ' + y + ') on the image. ' +
                'There ' + densityVerb + ' ' + density + ' other ' + pointOrPoints + ' in a range of ' +
                range + ' pixels to this point.';

            infoPopup(message);
        };

        /**
         * Displays an informative popup with Fomantic-UI that contains a message.
         */
        function infoPopup(message) {
            $('.eyecloud_info') // Close info toast
                .toast('close')
            $('body')
                .toast({
                    showIcon: 'info',
                    title: 'Eye Cloud Info',
                    displayTime: 0,
                    message: message,
                    class: 'info eyecloud_info',
                    position: 'bottom left',
                    closeIcon: true
                });
        };

        /**
         * Draws the area on the map for a circle of the eye cloud.
         */
        function showArea() {
            d3.select('#cloud_group').style('visibility', 'hidden'); // Hide the eye cloud

            let areaZoom = d3.zoom(); // Initialize d3.zoom for the area functionality

            // This prevents the eye cloud from moving while the area is visible
            areaZoom.filter(() =>
                (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));

            let translateWidth = d3.select('#cloud_svg').attr('width') / 4; // To center the area
            let translateHeight = d3.select('#cloud_svg').attr('height') / 4; // To center the area

            let areaGroup = d3.select('#cloud_svg')
                .append('g')
                .call(areaZoom.on('zoom', null)) // Disable zooming of the eye cloud while the area is visible
                .attr('id', 'area_group')
                .attr('transform', 'translate(' + translateWidth + ',' + translateHeight + ') ' + 'scale(0.5)')

            areaGroup // Display the map
                .append('image')
                .attr('id', 'map_area')
                .attr('x', -clickedObject.co_x + (d3.select('#cloud_svg').attr('width') / 2))
                .attr('y', -clickedObject.co_y + (d3.select('#cloud_svg').attr('height') / 2))
                .attr('href', dataset.url + '/images/' + properties.image)

            areaGroup // Display a circle that represents the range
                .append('circle')
                .attr('id', 'area_circle')
                .attr('cx', d3.select('#cloud_svg').attr('width') / 2)
                .attr('cy', d3.select('#cloud_svg').attr('height') / 2)
                .attr('r', range)
                .attr('stroke', properties.getColorHex())
                .attr('stroke-width', 3)
                .attr('fill', 'none');

            areaGroup // Display a circle that represents the size of the used circle
                .append('circle')
                .attr('id', 'area_cloud')
                .attr('cx', d3.select('#cloud_svg').attr('width') / 2)
                .attr('cy', d3.select('#cloud_svg').attr('height') / 2)
                .attr('r', radiusScale(densities[clickedObject.index]))
                .attr('stroke', properties.getColorHex())
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', 5) // Dashed line
                .attr('fill', 'none');

            // Create a rectangle that covers the entire svg-element. Its function is to capture any click on the box
            areaGroup
                .append('rect')
                .attr('id', 'area_rect')
                .attr('x', -d3.select('#cloud_svg').attr('width') / 2) // Fit the rectangle for the translate
                .attr('y', -d3.select('#cloud_svg').attr('height') / 2) // Fit the rectangle for the translate
                .attr('width', d3.select('#cloud_svg').attr('width') * 2) // Fit the rectangle for scale 0.5
                .attr('height', d3.select('#cloud_svg').attr('height') * 2) // Fit the rectangle for scale 0.5
                .attr('stroke', 'none')
                .attr('fill-opacity', 0); // Make the rectangle transparent

            // Disable all contextmenu options
            let areaMenu = menu();
            for (let i = 0; i < areaMenu.length; i++) { // Disable all elements in the menu
                areaMenu[i].disabled = true;
            }
            areaMenu[1] = { // Replace the 'show area on map' option with 'close area on map'
                title: 'Close area on map',
                action: function () {
                    setContextMenus();
                    removeAreaGroup();
                }
            };

            d3.select('#area_group').selectAll('rect').on('contextmenu', d3.contextMenu(areaMenu)); // Set context menu

            // Upon left click of the newly generated group, remove it
            areaGroup.on('click', function () {
                setContextMenus();
                removeAreaGroup();
            });
        };

        /**
         * Remove the svg-group that is created to show the area of a circle on the map.
         */
        function removeAreaGroup() {
            d3.select('#cloud_group').style('visibility', 'visible'); // Make eye cloud visible again
            d3.select('#area_group').remove();
        };

        /**
         * Disables circle by removing it from the coordinates array and removing its density.
         */
        function disableCircle(object) {
            // Remove selected circle from the coordinates array
            coordinates = coordinates.filter(coordinate => coordinate.index !== object.index);
            // Remove density that belongs to the removed circle
            densities.splice(object.index, 1);
            enabledDisabled = true; // So that the visualization won't be rescaled
            draw(); // Redraw
        };

        /**
         * Enables all circles again by regenerating the data.
         */
        function enableCircles() {
            generateData(dataset.getImageData(properties.image)); // Regenerate all coordinates
            enabledDisabled = true; // So that the visualization won't be rescaled
            draw(); // Redraw
        };

        /**
         * Resize the SVG-element.
         */
        function resize(){
            d3.select('#cloud_svg')
                .attr('width', width)
                .attr('height', height)
        };
    };

    /**
     * Centers the eye cloud on the box by making computations for a scale of 1.
     * First, it tries to scale the eye cloud by width, since the eye cloud is wider than it is high.
     * If the eye cloud is not fully visible after that, the eye cloud is scaled to its height.
     */
    center() {
        let svg = d3.select('#cloud_svg');

        svg.call(this.zoom.scaleTo, 1); // First, set scale to 1

        let svgWidth = svg.attr('width');
        let svgHeight = svg.attr('height');

        let cloudWidth = document.getElementById('cloud_group').getBoundingClientRect().width;

        let scale = svgWidth / (cloudWidth + 50); // Compute new scale for dimensions at scale = 1
        svg.call(this.zoom.scaleTo, scale); // Set scale
        svg.call(this.zoom.translateTo, svgWidth / 2, svgHeight / 2); // Center the eye cloud

        let cloudHeight = document.getElementById('cloud_group').getBoundingClientRect().height;

        if (svgHeight <= cloudHeight) { // If the eye cloud is not fully visible
            svg.call(this.zoom.scaleTo, 1); // Set scale to 1 again

            cloudHeight = document.getElementById('cloud_group').getBoundingClientRect().height;

            scale = svgHeight / (cloudHeight + 50);
            svg.call(this.zoom.scaleTo, scale); // Set scale
            svg.call(this.zoom.translateTo, svgWidth / 2, svgHeight / 2); // Center the eye cloud
        }
    };

    /**
     * Set the scale of the zoom to 0.5 after drawing the eye cloud.
     */
    setDefaultScale() {
        let svg = d3.select('#cloud_svg');

        let svgWidth = svg.attr('width');
        let svgHeight = svg.attr('height');

        svg.call(this.zoom.scaleTo, 0.5);
        svg.call(this.zoom.translateTo, svgWidth / 2, svgHeight / 2); // Center the eye cloud
    };
}