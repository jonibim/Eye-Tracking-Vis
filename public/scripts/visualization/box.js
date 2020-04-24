// container for the visualization
class Box {


    constructor(column, row, div) {
        this.column = column;
        this.row = row;
        this.div = div;
    }

    getWidth() {
        return boxManager.getBoxWidth();
    }

    getHeight() {
        return boxManager.getBoxHeight();
    }
}