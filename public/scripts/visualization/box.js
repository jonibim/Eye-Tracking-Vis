// container for the visualization
class Box {

    constructor(column, row, div) {
        this.column = column;
        this.row = row;
        this.div = div;

        this.onmove = [];
        this.onresize = [];
    }

    move(column, row){
        this.column = column;
        this.row = row;
        for(let i = 0; i < this.onmove.length; i++)
            this.onmove[i](column, row);
    }

    resize(){
        const width = this.getWidth(), height = this.getHeight();
        for(let i = 0; i < this.onresize.length; i++)
            this.onresize[i](width, height);
    }

    getWidth() {
        return boxManager.getBoxWidth(this);
    }

    getHeight() {
        return boxManager.getBoxHeight(this);
    }
}