class GazeStripe extends Visualization {
    
    constructor(box) {

		/**
		 * the third parameter is used as a identifier for the HTML 
		 * object so that it can be modified easily from the code
		 * Such modicaitons can be as adding a loader 
		 */
        super(box, 'Gaze Stripe', 'gzviz')

        let frameWidth = box.inner.clientWidth;
        let frameHeight = box.inner.clientHeight;

        this.img = new Image();
        this.zoomValue = 50;
        this.users;

		let svg = d3.select(box.inner)
			.classed('smalldot',true)
            .append('svg')
            .attr('width', frameWidth) // Full screen
            .attr('height', frameHeight) // Full screen
			.append('g')
            .attr('transform', "translate(0 ,0)");

        let usersx;
        let usersy;
        let shortestPath;
        let longestTime; 
       	let height;    
        let data;
        let drawing;

        this.resizeTimer = setInterval(() => {
            if (frameWidth !== this.box.inner.clientWidth || frameHeight !== this.box.inner.clientHeight) {
            	scale();
            	draw(this.img, this.zoomValue);
            }
        }, 100);

        properties.onchange.set('gazestripe', () => {
        	scale();	
            if (this.img !== properties.image || this.zoomValue !== properties.zoomValue || this.users !== properties.users) {
	            this.img = properties.image;
	            this.users = properties.users;
	            if (typeof properties.zoomValue !== 'undefined') {
	            	this.zoomValue = properties.zoomValue;
	            }
            	if (drawing !== 1) {
	            	drawing = 1;
            		loadData(this.img, this.zoomValue);   
        		}        	
            }
 	       })

        function scale() {
        	
        	frameWidth = box.inner.clientWidth;
        	frameHeight = box.inner.clientHeight;

        	svg
        	.attr('width', frameWidth) // Full screen
            .attr('height', frameHeight) // Full screen.attr('transform', "translate(0 ,0)");
        	.attr('transform', "translate(0 ,0)");
        }

	    function loadData(img, zoomValue) {

	    	box.inner.clientWidth
	    	usersx = {};
	    	usersy = {};
	    	shortestPath = Math.pow(10, 1000);
	    	longestTime = {};

	        d3.tsv(dataset.url + '/dataset.csv').then(function(data) {
	            let dataByCity = d3.nest().key(function(data) {
	                return data.StimuliName;
	            }).entries(data);
	            let dataByTimestamp = d3.nest().key(function(data) { 
	                return data.user;
	            }).entries(dataByCity);        
	            data = dataByTimestamp[0]['values'];

	            processData(data, img);
	            draw(img, zoomValue);
	        })
	    }

	    function processData(data, img) {

	        let mapObj = {};
	        for (var i = 0; i < data.length; i++) {
	            mapObj[i] = Object.values(data)[i]['key'];   
	        }           
	                
	        let map = Object.values(mapObj).indexOf((img));
	        data[map]['values'].forEach(function(participant) {
	        	if (properties.users.includes(participant['user'])) {
		            let user = participant['user']
		            if (typeof usersx[user] == 'undefined') {
		                usersx[user] = [];
		                usersy[user] = [];
		                longestTime[user] = [];
		            }
		            usersx[user].push(participant['MappedFixationPointX']);
		            usersy[user].push(participant['MappedFixationPointY']);
		            longestTime[user].push(participant['Timestamp']);
		        }
	        });                

	        for (const key of Object.keys(usersx)) {
	            if(usersx[key].length <= shortestPath) {
	                shortestPath = usersx[key].length;
	            }
	        }
	    }

	    function draw(img, zoomValue) {

			if (!properties.image) {
	    		return;
	    	}

	    	svg.selectAll("#gazestripeg").remove();

	        let width = (Math.floor(frameWidth / (shortestPath + 3))).toString();
	        let imgHeight = width;
	        let textHeight = ((Math.floor(frameWidth / shortestPath)) / 3).toString();
	        let fontsize1 = textHeight * 0.7;
	        let fontsize2 = fontsize1 * 0.7;
	        let height = Object.keys(usersx).length * (Number(imgHeight) + Number(textHeight));
	    	let counter = 0;

	        for (const key of Object.keys(usersx)) {
	        	let divisor = usersx[key].length / shortestPath;
	 			let timestamp = [0];
	        	let imgLine = svg.append('g').attr('id', 'gazestripeg');
	        	let timeLine = svg.append('g').attr('id', 'gazestripeg');

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
	                    .attr('xlink:href', dataset.url + '/images/' + (img))
	                if (i >= 1) {
	                    let longestTimeIndex = Math.round(divisor * i);              
	                    timestamp.push(((longestTime[key][longestTimeIndex] - longestTime[key][longestTimeIndex-1]) + timestamp[timestamp.length - 1]));
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
	        }
	    	d3.select('svg').call(
	    		d3.zoom()
	    		.on("zoom", function () {
	    	    svg.attr("transform", d3.event.transform)
	    	}))
			drawing = 0;
		}
	}
}