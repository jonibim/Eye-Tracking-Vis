class GazeStripe extends Visualization {
    
    constructor(box) {
        super(box, 'Gaze Stripe')

        let visualizations = d3.select(box.inner)
        let frameWidth = box.inner.clientWidth;
        console.log(frameWidth)
        let frameHeight = box.inner.clientHeight;
       
        let usersx = {};
        let usersy = {};
        let shortestPath = 999999;
        let longestTime = {};
        let offset = 50

        let data = null
        let imgName =  "01_Antwerpen_S1.jpg"
        loadData()
   
            
    function loadData() {
        d3.tsv('/testdataset/all_fixation_data_cleaned_up.csv').then(function(data) {
            let dataByCity = d3.nest().key(function(data) {
                return data.StimuliName;
            }).entries(data);
            let dataByTimestamp = d3.nest().key(function(data) { 
                return data.user;
            }).entries(dataByCity);        
            data = dataByTimestamp[0]['values'];

            processData(data);
            draw();
        })
    }

    function changeImage() {
        return properties.image;
    }

    function processData(data) {

        let map_obj = {};
        for (var i = 0; i < data.length; i++) {
            map_obj[i] = Object.values(data)[i]['key'];   
        }           
                
        let map = Object.values(map_obj).indexOf(imgName);
        console.log(imgName)
        data[map]['values'].forEach(function(participant) {
            let user = participant['user']
            if (typeof usersx[user] == 'undefined') {
                usersx[user] = [];
                usersy[user] = [];
                longestTime[user] = [];
            }
            usersx[user].push(participant['MappedFixationPointX']);
            usersy[user].push(participant['MappedFixationPointY']);
            longestTime[user].push(participant['Timestamp']);
        });                

        for (const key of Object.keys(usersx)) {
            if(usersx[key].length <= shortestPath) {
                shortestPath = usersx[key].length;
            }
        }
    }

    function draw() {

        let width = (Math.floor(frameWidth / shortestPath) / 2).toString();
        let imgHeight = width;
        let textHeight = ((Math.floor(frameWidth / shortestPath)) / 6).toString();
        let fontsize1 = textHeight;
        let fontsize2 = ((Math.floor(frameWidth / shortestPath)) / 8).toString();

        for (const key of Object.keys(usersx)) {
            let divisor = usersx[key].length / shortestPath;
            let timestamp = [0];
            let imageDiv = visualizations.append('div');
            let timelineDiv  = visualizations.append('div');
            imageDiv.append('svg').attr('width', width).attr('height', imgHeight).attr('preserveAspectRatio', 'xMaxYMax meet').attr('viewBox', ('-' + fontsize1 + ' -' + (Number(fontsize2) * 2).toString() + ' ' + width + ' ' + width).toString()).append("text").text(key).attr('font-size', fontsize1);
            timelineDiv.append('svg').attr('width', width).attr('height', textHeight).attr('viewBox', '0 -' + fontsize2 + ' ' + width + ' ' + textHeight).append("text").text('Time (ms)').attr('font-size', fontsize2);
            for (var i = 0; i < shortestPath; i++) {
                let x = usersx[key][Math.round(divisor * i)];
                let y = usersy[key][Math.round(divisor * i)];
                imageDiv.append('svg').attr('width', width).attr('height', imgHeight).attr('preserveAspectRatio', 'xMinYMin slice').attr('viewBox', '' + (x-offset) + ' ' + (y-offset) + ' ' + (2*offset) + ' ' + (2*offset)).append('image')
                    .attr('xlink:href', '/testdataset/images/' + (imgName))

                if (i >= 1) {
                    let longestTimeIndex = Math.round(divisor * i);
                    timestamp.push((longestTime[key][longestTimeIndex] - longestTime[key][longestTimeIndex-1] + timestamp[timestamp.length - 1]));
                }
                timelineDiv.append('svg').attr('width', width).attr('height', textHeight).attr('viewBox', (('-' + Number(fontsize2) * 1.5).toString() + ' -' + fontsize2 + ' ' + width + ' ' +  textHeight).toString()).append("text").text(timestamp[timestamp.length - 1]).attr('font-size', fontsize2);
            }                 
        }    
    }
}
}