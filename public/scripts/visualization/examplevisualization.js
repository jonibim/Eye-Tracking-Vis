/**
 * Example visualization
 */
class ExampleVisualization extends Visualization {

    /**
     * @param {Box} box
     * @param {int} image
     */
    constructor(box, image) {
        super(box, 'Example');

        // create elements
        let onload = () => {
            let img = document.createElement('img');
            img.setAttribute('src','/testdataset/images/' + dataset.getImages()[image ? image : 0]);
            img.setAttribute('width','100%');
            img.setAttribute('height','100%');
            this.box.inner.appendChild(img);
        }

        // activate onload only when dataset is loaded
        if(dataset.isLoaded)
            onload();
        else
            dataset.onload.push(onload);
    }

}