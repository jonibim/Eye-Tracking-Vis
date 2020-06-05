/**
 * Main container for the visualization page
 * @type {Element}
 */
let frame = null;
/**
 * @type {BoxManager}
 */
let boxManager = null;
/**
 * @type {Properties}
 */
let properties = null;
/**
 * @type {string}
 */
let datasetId;
/**
 * @type {Dataset}
 */
let dataset = null;
/**
 * The element which displays the dataset name
 * @type {Element}
 */
let topbar = null;
/**
 * @type {Registry}
 */
let registry = null;

function resizeBoxes() {
    for(let visualization of registry.getVisualizationInstances())
        visualization.onResize();
}

// initialize default visualizations
window.onload = async () => {

    console.log('main.js - Loading...');

    dataset = new Dataset();
    frame = document.getElementById('innerframe');
    boxManager = new BoxManager(frame);
    properties = new Properties();
    registry = new Registry();

    // register visualizations
    
    registry.register('gazestripe', box => new GazeStripe(box));
    registry.register('eyecloud', box => new EyeCloud(box));
    registry.register('attentionmap', box => new AttentionMap(box));
    registry.register('editor', box => new Editor(box));
    registry.register('transitiongraph', box => new TransitionGraph(box));


    console.log('main.js - Finished Loading')


    console.log('main.js - Enabling visualizations...')
    window.onresize = resizeBoxes;
    openSettings() // keep the settings opened in the start
    registry.enableAll();
    console.log('main.js - Visualizations enabled')


    console.log('main.js - Requesting dataset...')

    // get the url parameters
    let params = new URLSearchParams(window.location.search);
    // get dataset url for id or the default
    datasetId = params.has('id') && !!params.get('id').trim() ? params.get('id') : '';
    const url = datasetId ? '/datasets/uploads/' + datasetId : '/datasets/default';
    const request = fetch(url + '/data.json', { method: 'GET' });
    await request.then(response => response.arrayBuffer()).then(buffer => {
        let decoder = new TextDecoder("utf8");
        let data = decoder.decode(buffer);
        dataset.importData(data, url);
    });

    console.log('main.js - Dataset loaded')


    console.log('main.js - Initializing Settings...')
    selectImage(dataset.images[0].image);
    applySettings();
    console.log('main.js - Settings Initialized')
}
