// default visualization, extend this class to implement a visualization
class Visualization {
    constructor(box, title) {
        this.box = box;
        this.setTitle(title)
    }

    setTitle(title){
        this.box.title.textContent = title;
    }
}
