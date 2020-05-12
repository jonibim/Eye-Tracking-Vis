/**
 * Gaze Stripe visualization
 */
class GazeStripe extends Visualization {

    /**
     * @param {Box} box
     */
    constructor(box) {
        super(box, 'Gaze Stripe');

        d3.tsv('/testdataset/all_fixation_data_cleaned_up.csv').then(function(data) {;
            const dataByCity = d3.nest().key(function(data) {return data.StimuliName;}).entries(data);
            const dataByTimestamp = d3.nest().key(function(data) {return data.user;}).entries(dataByCity)[0]['values'];
            console.log(dataByTimestamp);
        

            let users = [];
            let usersx = {};
            let usersy = {};
            let map = 0;
            let offset = 100;
            let shortestPath = 9999999;
            let longestTime= {};
            let visualizations = d3.select('.inner-box')
            let width = '5%';
            let height = '5%';

            let map_obj = {};
            for (var i = 0; i < dataByTimestamp.length; i++) {
                map_obj[i] = Object.values(dataByTimestamp)[i]['key'];   
            }           

            dataByTimestamp[map]['values'].forEach(function(participant) {
                if (!(users.includes(participant['user'])))
                    users.push(participant['user']);
            });
                            
            users.forEach(function(data) {
                usersx[data] = [];
                usersy[data] = [];
                longestTime[data] = [];
            });                  

            dataByTimestamp[map]['values'].forEach(function(data) {
                usersx[data['user']].push(data['MappedFixationPointX']);
                usersy[data['user']].push(data['MappedFixationPointY']);
                longestTime[data['user']].push(data['Timestamp']);

            });

            for (var i = 0; i < dataByTimestamp[map]['values'].length; i++) {                  
                if(dataByTimestamp[map]['values'][i] ) {
                    longestTime[0] = 0;
                }
            }

            for (const key of Object.keys(usersx)) {
                if(usersx[key].length <= shortestPath) {
                    shortestPath = usersx[key].length;
                }
            }                   

            for (const key of Object.keys(usersx)) {
                let divisor = usersx[key].length / shortestPath;
                let timestamp = [0];
                let imageDiv = visualizations.append('div');
                let timelineDiv  = visualizations.append('div');
                imageDiv.append('svg').attr('width', width).attr('height', height).attr('preserveAspectRatio', 'xMaxYMax meet').attr('viewBox', '-90 -170 300 300').append("text").text(key).attr('font-size', '100px');
                timelineDiv.append('svg').attr('width', width).attr('height', height).attr('viewBox', '0 -70 300 100').append("text").text('Time (ms)').attr('font-size', '70px');
                for (var i = 0; i < shortestPath; i++) {
                    let x = usersx[key][Math.round(divisor * i)];
                    let y = usersy[key][Math.round(divisor * i)];
                    imageDiv.append('svg').attr('width', width).attr('height', height).attr('preserveAspectRatio', 'xMinYMin slice').attr('viewBox', '' + (x-offset) + ' ' + (y-offset) + ' ' + (2*offset) + ' ' + (2*offset)).append('image')
                        .attr('xlink:href', '/testdataset/images/' + map_obj[map])

                    if (i >= 1) {
                        let longestTimeIndex = Math.round(divisor * i);
                        timestamp.push((longestTime[key][longestTimeIndex] - longestTime[key][longestTimeIndex-1] + timestamp[timestamp.length - 1]));
                    }
                    timelineDiv.append('svg').attr('width', width).attr('height', height).attr('viewBox', '-70 -70 300 100').append("text").text(timestamp[timestamp.length - 1]).attr('font-size', '70px');
                                 
                }    
            }
        });
    }
}