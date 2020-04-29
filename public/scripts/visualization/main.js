let frame = null;
let boxManager = null;
let properties = null;
let dataset = null;
let topbar = null;

// initialize default visualizations
window.onload = () => {
    console.log('main.js - Loading...');

    dataset = new Dataset();
    topbar = document.getElementById('topbar');
    dataset.onload.push(() => topbar.textContent = 'DATASET: ' + dataset.name)
    frame = document.getElementById('innerframe');
    boxManager = new BoxManager(frame);
    properties = new Properties();

    // add example visualizations
    let box = boxManager.addBox(0,0);
    new ExampleVisualization(box);
    box = boxManager.addBox(0,1);
    new ExampleVisualization(box, 1);
    box = boxManager.addBox(1,0);
    new ExampleVisualization(box, 1);

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
