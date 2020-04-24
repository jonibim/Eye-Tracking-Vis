// will create new boxes to put visualizations in
class BoxManager {

    constructor(frame) {
        this.frame = frame;
        this.boxes = [];
        this.rows = 0;
        this.columns = 0;
        this.columnDivs = [];
    }

    addBox(column, row) {
        if(this.columns <= column) {
            this.columns = column + 1;
            while (this.boxes.length <= column) {
                this.boxes.push([]);
                this.addColumnDiv(this.boxes.length);
            }
        }
        if(this.rows <= row)
            this.rows = row + 1;


        let box = new Box(column,row,this.createBoxDiv(column,row));
        this.boxes[column][row] = box;
        return box;
    }

    removeBox(column, row){
        // TODO
    }

    getBoxWidth() {
        return frame.offsetWidth / this.columns;
    }

    getBoxHeight() {
        return frame.offsetHeight / this.rows;
    }

    addColumnDiv(column){
        let div = document.createElement('div');
        div.setAttribute('class','column');

        this.columnDivs.push(div);
        this.frame.appendChild(div);
    }

    createBoxDiv(column, row){
        let div = document.createElement('div');
        div.setAttribute('class','box');

        let columnDiv = this.columnDivs[column];
        if(columnDiv.children.length <= row)
            columnDiv.appendChild(div);
        else
            columnDiv.insertBefore(div, columnDiv.children[row + 1]);

        return div;
    }
}