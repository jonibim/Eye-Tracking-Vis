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
window.onload = () => {

    console.log('main.js - Loading...');

    dataset = new Dataset();
    topbar = document.getElementById('topbar');
    dataset.onload.push(() => topbar.textContent = 'DATASET: ' + dataset.name)
    frame = document.getElementById('innerframe');
    boxManager = new BoxManager(frame);
    properties = new Properties();
    registry = new Registry();

    // register visualizations
    registry.register('attentionmap',box => new AttentionMap(box));
    registry.register('editor',box => new Editor(box));
    console.log('main.js - Finished Loading')


    console.log('main.js - Enabling visualizations...')
    registry.enableAll();
    console.log('main.js - Visualizations enabled')


    console.log('main.js - Requesting dataset...')

    const url = '/visualization';
    const data = fetch(url, {method: 'POST'});
    data.then(data => data.text()).then(data => {
        dataset.importData(data);

        applySettings();

        console.log('main.js - Dataset loaded')
    });
}
