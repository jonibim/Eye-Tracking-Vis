/**
 Gaze Struoe visualization
 */

class GazeStripe extends Visualization {   
    constructor(box) {

        super(box, 'Gaze Stripe', 'gazestripeviz');

        this.frameWidth = this.box.inner.clientWidth;                               // width of the box shown to the user
        this.frameHeight = this.box.inner.clientHeight;                             // height of the box shown to the user
        this.opacity = 1;                                                           // opacity used for displaying either gaze stripes or animation
        this.init = 1;                                                              // script is initilaized
        this.dimmerBoolean = false;                                                 // visualization's dimmer boolean
        this.animationRunning = false;                                              // boolean expressing if animation is running

        this.svg = d3.select(this.box.inner)                                        // svg holding the gaze stripe visualization
            .classed('smalldot ', true)
            .append('svg')
            .attr('width', this.frameWidth)
            .attr('height', this.frameHeight)

        this.graphics = this.svg.append('g');                                       // child of this.svg holding gaze stripe visualization
        this.userSelection = this.svg.append('g').style('opacity', 0)               // chilc of this.svg hodling user animation

        this.zoom = d3.zoom();                                                      // setting zoom for the main svg
        this.zoom.filter(() => (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));
        this.svg.call(
            this.zoom.on('zoom', () => {
                this.opacity == 1 ? this.graphics.attr('transform', d3.event.transform) : this.userSelection.attr('transform', d3.event.transform);
            })
        );

        this.image = new Image();                                                   // initializaing new image 
        this.image.onload = () => {                                                 // upon load, draw the gaze stripes
            this.draw();
        }

        /**
         * setting listeners for used settings
         */

        properties.setListener('gazestripe', 'image', () => {
            this.image.src = properties.image ? dataset.url + '/images/' + properties.image : '';
            if (this.init == 0) {
                this.draw();
            }
        });
        properties.setListener('gazestripe', 'zoom', () => {
            if (this.init == 0) {
                this.draw();
            }
        });
        properties.setListener('gazestripe', 'users', () => {
            properties.users == 0 ? this.dimmerBoolean = true : this.dimmerBoolean = false;
            this.dimmer();

            this.users = properties.users;
            if (this.init == 0) {
                this.draw();
            }
        })

        this.resizeTimer = setInterval(() => {
            if (this.frameWidth !== this.box.inner.clientWidth || this.frameHeight !== this.box.inner.clientHeight) {
                if (this.opacity == 1) {
                    this.scale();
                }
            }
        }, 100);

        if (this.init ==  1) {                                                          // upon initializaiton draw the gaze stripes and disable dimmer
            this.image.src = properties.image ? dataset.url + '/images/' + properties.image : '';
            properties.users === 0 ? this.dimmerBoolean = true : this.dimmerBoolean = false;
            this.dimmer();
            this.draw();
        }

        /**
         * context menu item
         */
         
        this.menu = [
            {
                title: 'Open gaze stripe settings',
                action: () => {
                    showGazeStripeSettings();
                }
            },
            {
                title: 'Center visualization',
                action: () => {
                    //this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(1));
                    this.scale();
                }
            }, 
            {
                title: 'Download as image',
                action: () => {
                downloadSVG(this.svg.node(), 'Gaze Stripe');
                }
            },
        ];

        this.svg.on('contextmenu', d3.contextMenu(this.menu));
    }

    /**
     * draws the gaze stripe on the given box
     */

    draw() {

        this.resetView();
        this.init = 0;

        if (!properties.image)
            return;

        const imageData = dataset.getImageData(properties.image);                       // load image data

        this.graphics.selectAll('*').remove();

        let usersx = {};                                                                // object holding all x fixation points
        let usersy = {};                                                                // object holding all y fixaiton points
        let shortestPath = Math.pow(10, 1000);                                          // the number of observations of the user with the least data
        let longestTime = {};                                                           // the timestamps for all users    

        properties.users.forEach(function(participant) {                                // add all users that are selected
            usersx[participant] = [];
            usersy[participant] = [];
            longestTime[participant] = [];
        })

        imageData['scanpaths'].forEach(function(user) {                                 // add the data to usersx, usersy and longestTime objects
            let participant = user['person'];
            if (properties.users.includes(participant)) {
                user['points'].forEach(function(points) {
                    usersx[participant].push(points['x']);
                    usersy[participant].push(points['y']);
                    longestTime[participant].push(points['time']);
                })
            }
        })
        
        for (const key of Object.keys(usersx)) {                                        // find the user with the least data present to set as shortestPath
            if(usersx[key].length <= shortestPath) {
                shortestPath = usersx[key].length;
            }
        }

        /**
         * computing values for drawing all the gazes scaLed
         * zoomvalue is a user changeable setting, allowing for the ability to change the level of zoom
         */

        this.frameWidth = this.box.inner.clientWidth;
        this.frameHeight = this.box.inner.clientHeight;
        let width = (Math.floor(this.frameWidth / (shortestPath + 1))).toString();
        let imgHeight = (Math.floor(this.frameWidth / (shortestPath + 1)));
        let textHeight = ((Math.floor(this.frameWidth / shortestPath)) / 3).toString();
        let fontsize1 = ((Math.floor(this.frameWidth / shortestPath)) / 3) * 0.7;
        let fontsize2 = ((Math.floor(this.frameWidth / shortestPath)) / 3) * 0.7 * 0.7;
        let height = Object.keys(usersx).length * (Number(this.imgHeight) + Number(this.textHeight));
        let zoomValue = properties.zoomValue ? properties.zoomValue : 50;

        /**
         * drawing the imageline and timeline using the earlier retrieved data
         * imgLine holds all the images and the text showing the selected user
         * timeLine holds all the timestamps  and the "Time (ms)"
         * For each imgLine there is also a on click functionality, displaying an animation of what the user is was looking at in order
         */

        let counter = 0;
        for (const key of Object.keys(usersx)) {
            let divisor = usersx[key].length / shortestPath;
            let timestamp = [0];
            let imgLine = this.graphics.append('g')
            let timeLine = this.graphics.append('g')
            this.imgLine = imgLine;

            imgLine.append('svg').attr('y', counter*(Number(imgHeight) + Number(textHeight)) + Number(textHeight)).attr('width', width).attr('height', imgHeight).attr('preserveAspectRatio', 'xMaxYMax meet').attr('viewBox', ('-' + fontsize1 + ' -' + (Number(fontsize2) * 2).toString() + ' ' + width + ' ' + width).toString()).append("text").text(key).attr('font-size', fontsize1);
            timeLine.append('svg').attr('y', counter*(Number(imgHeight) + Number(textHeight)) + Number(imgHeight)).attr('width', width).attr('height', textHeight).attr('viewBox', '0 -' + fontsize2 + ' ' + width + ' ' + textHeight).append("text").text('Time (ms)').attr('font-size', fontsize2);

            for (var i = 0; i < shortestPath; i++) {
                let x = usersx[key][Math.round(divisor * i)];
                let y = usersy[key][Math.round(divisor * i)];
                imgLine
                    .append('svg')
                    .attr('x', (i + 1) * width)
                    .attr('y', counter*(Number(textHeight) + Number(imgHeight)))
                    .attr('width', width)
                    .attr('height', imgHeight)
                    .attr('viewBox', '' + (x-zoomValue) + ' ' + (y-zoomValue) + ' ' + (2*zoomValue) + ' ' + (2*zoomValue))
                    .attr('preserveAspectRatio', 'xMinYMin slice')
                    .append('image')
                    .attr('xlink:href', this.image.src)
                if (i >= 1) {
                    let longestTimeIndex = Math.round(divisor * i);              
                    timestamp.push(((longestTime[key][longestTimeIndex] -longestTime[key][longestTimeIndex-1]) + timestamp[timestamp.length - 1]));
                }
                timeLine
                    .append('svg')
                    .attr('x', (i + 1) * width)
                    .attr('y', counter*(Number(imgHeight) + Number(textHeight)) + Number(imgHeight))
                    .attr('width', width)
                    .attr('height', textHeight)
                    .attr('viewBox', (('-' + Number(fontsize2) * 1.5).toString() + ' -' + fontsize2 + ' ' + width + ' ' +  textHeight).toString())
                    .append("text")
                    .text(timestamp[timestamp.length - 1])
                    .attr('font-size', fontsize2);
            }
            counter += 1;

            /**
             * on click animation functionality
             */

            let toggleAnimationMenu = [
                {
                    title: 'Toggle animation',
                    action: () => {
                        if (this.opacity == 1) {
                            this.animation(key, shortestPath, usersx, usersy, longestTime, divisor, timestamp);     
                        } else {
                            this.resetView();
                        }
                    }
                },
                {
                    divider: true
                },
                {
                    title: 'Open gaze stripe settings',
                    action: () => {
                        showGazeStripeSettings();
                    }
                },
                {
                    title: 'Center visualization',
                    action: () => {
                        //this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(1));
                        this.scale();
                    }
                }, 
                {
                    title: 'Download as image',
                    action: () => {
                    downloadSVG(this.svg.node(), 'Gaze Stripe');
                    }
                },
            ];

            imgLine.on('contextmenu', d3.contextMenu(toggleAnimationMenu));
        
            imgLine
                .on('mouseover', function(d) {
                    d3.select(this).style('cursor', 'pointer')
                })
                .on('click', () => {
                    this.animation(key, shortestPath, usersx, usersy, longestTime, divisor, timestamp);
                    this.svg.on('contextmenu', d3.contextMenu(toggleAnimationMenu));
                    this.userSelection.on('contextmenu', d3.contextMenu(toggleAnimationMenu));
            });
        }
    }

    /**
     * finds the width and height of the given box and if necessary redraws the visualizaiton
     */

    scale() {

        if (this.opacity == 1) {
            this.frameWidth = this.box.inner.clientWidth;
            this.frameHeight = this.box.inner.clientHeight;

            this.svg
                .attr('width', this.frameWidth) // Full screen
                .attr('height', this.frameHeight) // Full screen.attr('transform', "translate(0 ,0)");
                .attr('transform', "translate(0 ,0)");
            this.draw();
        } else if (this.opacity == 0) {         
            this.svg
                .call(this.zoom.transform, d3.zoomIdentity.scale(1/3.7));
        }
    }

    /**
     * resets the zoom and deselcts the animation
     */

    resetView() {

        this.animationRunning = false;
        this.opacity = 1;
        this.graphics.style('opacity', this.opacity);
        this.userSelection.selectAll('*').remove();
        this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(1));
        this.svg.on('contextmenu', d3.contextMenu(this.menu));
        this.userSelection.on('contextmenu', d3.contextMenu(this.menu));
    }

    /*
     * Dims the canvas if no users are selected
     */

    dimmer() {
        if (this.dimmerBoolean) {
            
            let box = document.getElementById('gazestripeviz');
            let dimmer = document.createElement('div');
            dimmer.classList.add('ui', 'active', 'dimmer');
            dimmer.setAttribute("style", "z-index:10")
            dimmer.id = 'gazestripe_dimmer';
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
            content.append('div').attr('style', 'font-size: 12px').html("<a onclick='showUserSettings()'>Check the user settings to enable users<\a>")
        } else {
            if (!! document.getElementById('gazestripe_dimmer')) {
                document.getElementById('gazestripe_dimmer').remove();
                this.graphics.style('opacity', 1);
                this.userSelection.style('opacity', 1);
            }
        }
    }

    animation(key, shortestPath, usersx, usersy, longestTime, divisor, timestamp) {

        if (this.animationRunning) {
            return
        } else {
            this.animationRunning = true;
        }

        let oldOpacity = this.opacity
        if (this.opacity == 0) {
            this.opacity = 1;
        } else {
            this.opacity = 0;
        }

        this.scale();

        let runNumber = 0;
        this.graphics.style('opacity', this.opacity);
        this.userSelection.style('opacity', oldOpacity);
        this.userSelection.append('image')
            .attr('xlink:href', this.image.src)
            .attr('width', this.image.naturalWidth)
            .attr('height', this.image.naturalHeight)
            .attr('x', 200)
            .attr('y', 0);

        this.userSelection
            .append('text')
            .attr('x', 0)
            .attr('y', 250)
            .text(key)
            .attr('font-size', 100)

        let delayDuartion = 1000;
        let fixationDuration = 0;

        for (var i = 0; i < shortestPath; i++) {

            if (i !== 0) {
                fixationDuration = (timestamp[i] - timestamp[i - 1]);
            } else {
                fixationDuration = timestamp[i];
            }

            let rounder = Math.round(divisor * i);
            let x = usersx[key][rounder] - zoomValue / 2 + 200;
            let y = usersy[key][rounder] - zoomValue / 2;

            this.userSelection.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', zoomValue)
                .attr('height', zoomValue)
                .attr('fill', 'rgba(0,0,0,0)')
                .attr('stroke', properties.getColorHex())
                .attr('stroke-width', this.image.naturalWidth / 100)
                .attr('stroke-dasharray', '10,5')
                .attr('stroke-linecap', 'butt')
                .style('opacity', 0)
                .transition()
                .duration(500)
                .style('opacity', 1)
                .delay(delayDuartion)
                .transition()
                .duration(500)
                .style('opacity', 0)
                .delay(fixationDuration);

            runNumber += 1;
            this.userSelection
                .append('text')
                .attr('x', x + (zoomValue / 2))
                .attr('y', y + (zoomValue / 2) + 6)
                .text(runNumber)
                .attr('font-size', this.image.naturalWidth / 35)
                .style('text-anchor', 'middle')
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.6);

            this.userSelection
                .append('text')
                .attr('x', x + (zoomValue / 2))
                .attr('y', y + (zoomValue / 2) + 36)
                .text(timestamp[i])
                .attr('font-size', this.image.naturalWidth / 55)
                .style('text-anchor', 'middle')
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.4);

            delayDuartion += fixationDuration;
        }                

        this.userSelection.on('click', () => {
            if (this.opacity == 0) {
                this.resetView();
            }
        });
    }
}
