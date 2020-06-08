class GazeStripe extends Visualization {   
    constructor(box) {

        /**
         * the third parameter is used as a identifier for the HTML
         * object so that it can be modified easily from the code
         * Such modicaitons can be as adding a loader
         */
        super(box, 'Gaze Stripe');

        this.frameWidth = this.box.inner.clientWidth;
        this.frameHeight = this.box.inner.clientHeight;
        this.opacity = 1;       

        this.svg = d3.select(this.box.inner)
            .classed('smalldot ', true)
            .append('svg')
            .attr('width', this.frameWidth)
            .attr('height', this.frameHeight);

        this.graphics = this.svg.append('g');
        this.userSelection = this.svg.append('g').style('opacity', 0)

        this.zoom = d3.zoom();
        this.zoom.filter(() => (d3.event.type === 'mousedown' && d3.event.button === 1) || (d3.event.type === 'wheel' && d3.event.button === 0));
        this.svg.call(
            this.zoom.on('zoom', () => {
                this.opacity == 1 ? this.graphics.attr('transform', d3.event.transform) : this.userSelection.attr('transform', d3.event.transform);
            })
        );

        this.image = new Image();
        this.image.onload = () => {
            this.draw();
        }

        properties.setListener('gazestripe', ['image', 'users'], () => {
            this.image.src = properties.image ? dataset.url + '/images/' + properties.image : '';
            this.draw();
        });
        properties.setListener('gazestripe', 'zoom', () => {
            this.draw();
        });
        properties.setListener('gazestripe', 'users', () => {
            this.users = properties.users;
            this.draw();
        })

        if (properties.image)
            this.image.src = dataset.url + '/images/' + properties.image;

        this.resizeTimer = setInterval(() => {
            if (this.frameWidth !== this.box.inner.clientWidth || this.frameHeight !== this.box.inner.clientHeight) {
                this.scale();
            }
        }, 100);
    }

    draw() {

        this.resetView();


        if (!properties.image)
            return;

        const imageData = dataset.getImageData(properties.image);

        this.graphics.selectAll('*').remove();

        let usersx = {};
        let usersy = {};
        let shortestPath = Math.pow(10, 1000);
        let longestTime = {};

        properties.users.forEach(function(participant) {
            usersx[participant] = [];
            usersy[participant] = [];
            longestTime[participant] = [];
        })

        imageData['scanpaths'].forEach(function(user) {
            let participant = user['person'];
            if (properties.users.includes(participant)) {
                user['points'].forEach(function(points) {
                    usersx[participant].push(points['x']);
                    usersy[participant].push(points['y']);
                    longestTime[participant].push(points['time']);
                })
            }
        })
        
        for (const key of Object.keys(usersx)) {
            if(usersx[key].length <= shortestPath) {
                shortestPath = usersx[key].length;
            }
        }
        this.frameWidth = this.box.inner.clientWidth;
        this.frameHeight = this.box.inner.clientHeight;
        let width = (Math.floor(this.frameWidth / (shortestPath + 1))).toString();
        let imgHeight = (Math.floor(this.frameWidth / (shortestPath + 1)));
        let textHeight = ((Math.floor(this.frameWidth / shortestPath)) / 3).toString();
        let fontsize1 = ((Math.floor(this.frameWidth / shortestPath)) / 3) * 0.7;
        let fontsize2 = ((Math.floor(this.frameWidth / shortestPath)) / 3) * 0.7 * 0.7;
        let height = Object.keys(usersx).length * (Number(this.imgHeight) + Number(this.textHeight));
        let zoomValue = properties.zoomValue ? properties.zoomValue : 50;

        let counter = 0;
        for (const key of Object.keys(usersx)) {
            let divisor = usersx[key].length / shortestPath;
            let timestamp = [0];
            let imgLine = this.graphics.append('g')
            let timeLine = this.graphics.append('g')

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
        
            imgLine.on('click', () => {
                this.scale();
                let oldOpacity = this.opacity
                if (this.opacity == 0) {
                    this.opacity = 1;
                } else {
                    this.opacity = 0;
                }

                let runNumber = 0;
                this.graphics.style('opacity', this.opacity);
                this.userSelection.style('opacity', oldOpacity);
                this.userSelection.append('image')
                    .attr('xlink:href', this.image.src)
                    .attr('width', this.image.naturalWidth)
                    .attr('height', this.image.naturalHeight);

                for (var i = 0; i < shortestPath; i++) {

                    let x = usersx[key][Math.round(divisor * i)] - zoomValue / 2;
                    let y = usersy[key][Math.round(divisor * i)] - zoomValue / 2;
                    this.userSelection.append('rect')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('width', zoomValue)
                        .attr('height', zoomValue)
                        .attr('fill', 'rgba(0,0,0,0)')
                        .attr('stroke', properties.getColorHex())
                        .attr('stroke-width', '6')
                        .attr('stroke-dasharray', '10,5')
                        .attr('stroke-linecap', 'butt')
                        .style('opacity', 0)
                        .transition()
                        .duration(1000)
                        .style('opacity', 1)
                        .delay(i*1000)
                        .transition()
                        .duration(1000)
                        .style('opacity', 0)
                        .delay(3000)

                    runNumber += 1;
                    this.userSelection
                        .append('text')
                        .attr('x', x + (zoomValue / 2))
                        .attr('y', y + (zoomValue / 2) + 6)
                        .text(runNumber)
                        .attr('font-size', zoomValue / 2)
                        .style('text-anchor', 'middle');
                }                

                this.userSelection.on('click', () => {
                    if (this.opacity == 0) {
                        this.resetView();
                    }
                });
            });
        }
    }

    scale() {

        this.frameWidth = this.box.inner.clientWidth;
        this.frameHeight = this.box.inner.clientHeight;

        this.svg
        .attr('width', this.frameWidth) // Full screen
        .attr('height', this.frameHeight) // Full screen.attr('transform', "translate(0 ,0)");
        .attr('transform', "translate(0 ,0)");
        this.draw();
    }

    resetView() {

        this.opacity = 1;
        this.opacity = 1;
        this.graphics.style('opacity', this.opacity);
        this.userSelection.selectAll('*').remove();
    }
}
