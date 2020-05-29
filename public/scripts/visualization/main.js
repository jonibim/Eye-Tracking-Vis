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

// initialize default visualizations
window.onload = async () => {

    console.log('main.js - Loading...');

    dataset = new Dataset();
    topbar = document.getElementById('topbar');
    dataset.onload.push(() => topbar.textContent = 'DATASET: ' + dataset.name)
    frame = document.getElementById('innerframe');
    boxManager = new BoxManager(frame);
    properties = new Properties();
    registry = new Registry();

    // register visualizations
    registry.register('gazestripe', box => new GazeStripe(box));
    registry.register('eyecloud', box => new EyeCloud(box));
    registry.register('attentionmap', box => new AttentionMap(box));
    registry.register('transitiongraph', box => new TransitionGraph(box));
    registry.register('editor', box => new Editor(box));

    console.log('main.js - Finished Loading')


    console.log('main.js - Enabling visualizations...')
    registry.enableAll();
    console.log('main.js - Visualizations enabled')


    console.log('main.js - Requesting dataset...')

    // load the test dataset
    const url = '/visualization';
    const request = fetch(url, { method: 'POST' });
    await request.then(response => response.arrayBuffer()).then(buffer => {
        let decoder = new TextDecoder("iso-8859-1");
        let data = decoder.decode(buffer);
        dataset.importData(data);
    });
    

    console.log('main.js - Dataset loaded')


    console.log('main.js - Initializing Settings...')
    selectImage(dataset.images[0].image);
    applySettings();
    console.log('main.js - Settings Initialized')
}
