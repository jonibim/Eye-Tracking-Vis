let frame = null;
let boxManager = null;
let properties = null;
let dataset = null;

// initialize default visualizations
window.onload = () => {
    console.log('main.js - Loading...')

    dataset = new Dataset();
    frame = document.getElementById('frame');
    boxManager = new BoxManager(frame);
    properties = new Properties();

    // add example visualizations
    let box = boxManager.addBox(0,0);
    new AttentionMap(box);
    box = boxManager.addBox(0,1);
    new ExampleVisualization(box, 1);
    box = boxManager.addBox(1,0);
    new ExampleVisualization(box, 1);
    box = boxManager.addBox(1,1);
    new ExampleVisualization(box, 2);

    console.log('main.js - Finished Loading')

    console.log('main.js - Requesting dataset...')

    const url = '/visualization';
    const data = fetch(url, {method: 'POST'});
    data.then(data => data.text()).then(data => {
        dataset.importData(data);

        properties.setImage(dataset.getImages()[0]);

        console.log('main.js - Dataset loaded')
    });
}
