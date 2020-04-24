// example visualization
class ExampleVisualization extends Visualization {

    constructor(box, image) {
        super(box);

        dataset.onload.push(() => {
            let blueDiv = document.createElement('img');
            blueDiv.setAttribute('src','/testdataset/images/' + dataset.getImages()[image ? image : 0]);
            blueDiv.style.backgroundColor = 'blue';
            blueDiv.style.width = '100%';
            blueDiv.style.height = '100%';
            this.box.div.appendChild(blueDiv);
        })
    }

}