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
        while(this.columns <= column){
            this.columns++;
            this.boxes.push([]);
            this.addColumnDiv();
        }
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

    getBoxWidth(box) {
        return frame.offsetWidth / this.columns;
    }

    getBoxHeight(box) {
        if(box)
            return frame.offsetHeight / this.boxes[box.column].length;
        return frame.offsetHeight / this.rows;
    }

    addColumnDiv(){
        let div = document.createElement('div');
        div.setAttribute('class','column');
        let innerDiv = document.createElement('div');
        innerDiv.setAttribute('class','inner-column');
        div.appendChild(innerDiv);

        this.columnDivs.push(div);
        this.frame.appendChild(div);
    }

    createBoxDiv(column, row){
        let div = document.createElement('div');
        div.setAttribute('class','box');

        let columnDiv = this.columnDivs[column];

        let innerDiv = columnDiv.firstChild;
        if(!innerDiv.children || innerDiv.children.length <= row)
            innerDiv.appendChild(div);
        else
            innerDiv.insertBefore(div, innerDiv.children[row + 1]);

        return div;
    }
}