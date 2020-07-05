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
let datasetId = (() => {
    // get the url parameters
    let params = new URLSearchParams(window.location.search);
    let id = params.has('id') && !!params.get('id').trim() ? params.get('id') : (localStorage.getItem('datasetId') === null ? 'default' : localStorage.getItem('datasetId'));
    localStorage.setItem('datasetId',id);
    return id;
})();
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
    setTimeout(function () {
        for(let visualization of registry.getVisualizationInstances())
            visualization.onResize();
    }, 200);
}

// initialize default visualizations
window.onload = async () => {

    console.log("%cWelcome to ETViz project! 👁", "color:cyan; font-size:30px");
    console.log("%cSome errors might appear in here, please report them at https://github.com/t0xicdream/Eye-Tracking-Vis", "color:red; font-size:12px");

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


    //console.log('main.js - Finished Loading')


    //console.log('main.js - Enabling visualizations...')
    window.onresize = resizeBoxes;
    //openSettings() // keep the settings opened in the start
    registry.enableAll();
    //console.log('main.js - Visualizations enabled')


    //console.log('main.js - Requesting dataset...')

    let result = await requestDataset(datasetId);
    if(!result){
        datasetId = 'default';
        result = await requestDataset(datasetId);
    }
    dataset.importData(result.data, result.url);

    //console.log('main.js - Dataset loaded')


    //console.log('main.js - Initializing Settings...')
    selectImage(dataset.images[0].image);
    applySettings();
    //console.log('main.js - Settings Initialized')
    
    setTimeout(() => {
        if (dimmer.parentNode) dimmer.parentNode.removeChild(dimmer)
    }, 0);
}

/**
 * Requests the dataset from the server
 * @param {string} id
 * @return {{data: string, url: string}}
 */
async function requestDataset(id){
    // get dataset url for id or the default
    const url = datasetId === 'default' ? '/datasets/default' : '/datasets/uploads/' + datasetId;
    const request = await fetch(url + '/data.json', { method: 'GET' });
    if(request.status === 404)
        return '';

    // post used date update for dataset
    const update = new XMLHttpRequest();
    update.open('POST', '/dataset/date?id=' + datasetId);
    update.send();

    return {data: new TextDecoder("utf8").decode(await request.arrayBuffer()), url: url};
}
