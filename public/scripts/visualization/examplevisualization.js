// example visualization
class ExampleVisualization extends Visualization {

    constructor(box, image) {
        super(box, 'Example');

        dataset.onload.push(() => {
            let img = document.createElement('img');
            img.setAttribute('src','/testdataset/images/' + dataset.getImages()[image ? image : 0]);
            img.setAttribute("width","100%");
            img.setAttribute("height","100%");
            this.box.inner.appendChild(img);
        })
    }

}