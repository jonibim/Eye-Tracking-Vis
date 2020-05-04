/**
 * Will handle the boxes to put the visualizations in
 * @property {Element} frame - main visualization frame
 * @property {Box[][]} boxes - grid of all boxes, as [column][row]
 * @property {int} rows - the total number of rows
 * @property {int} columns - the total number of columns
 * @property {Element[]} columnDivs - all column elements
 */
class BoxManager {

    /**
     * @param frame - main visualization frame
     */
    constructor(frame) {
        this.frame = frame;
        this.boxes = [];
        this.rows = 0;
        this.columns = 0;
        this.columnDivs = [];
    }

    /**
     * Creates a box at the specified column and row
     * @param {int} column
     * @param {int} row
     * @returns {Box}
     */
    createBox(column, row) {
        return this.addBox(new Box(this.createBoxDiv()), column, row);
    }

    /**
     * Adds the given box at the specified column and row
     * @param {Box} box
     * @param {int} column
     * @param {int} row
     * @returns {Box}
     */
    addBox(box, column, row) {
        if (this.columns <= column) {
            this.columns++;
            this.boxes.push([]);
            this.addColumnDiv();
            // limit the column number as to not have empty columns in between
            column = this.columns - 1;
        }
        if (this.boxes[column].length <= row)
            // limit the row number as to not have empty rows in between
            row = this.boxes[column].length;

        this.boxes[column].splice(row, 0, box);
        this.moveBoxDiv(box,column,row);
        box.moved(column, row);
        for (let i = row + 1; i < this.boxes[column].length; i++)
            this.boxes[column][i].moved(column, i);
        return box;
    }

    /**
     * Removes the given box and moves other boxes into their correct positions
     * @param {Box} box - the box to be removed
     */
    removeBox(box) {
        let column = box.column;
        let row = box.row;
        // remove entire column if it's empty
        if (this.boxes[column].length === 1) {
            this.boxes.splice(column, 1);
            this.frame.removeChild(this.columnDivs[column]);
            this.columnDivs.splice(column, 1);
            for (let i = column; i < this.boxes.length; i++) {
                for (let j = 0; j < this.boxes[i].length; j++)
                    this.boxes[i][j].moved(i, j);
            }
        } else {
            this.boxes[column].splice(row, 1);
            this.columnDivs[column].firstChild.removeChild(box.div);
            for (let i = row; i < this.boxes[column].length; i++)
                this.boxes[column][i].moved(column, i);
        }
    }

    /**
     * @param {Box} box
     * @returns {number}
     */
    getBoxWidth(box) {
        return frame.offsetWidth / this.columns;
    }

    /**
     * @param {Box} box
     * @returns {number}
     */
    getBoxHeight(box) {
        if (box)
            return frame.offsetHeight / this.boxes[box.column].length;
        return frame.offsetHeight / this.rows;
    }

    /**
     * Creates the html elements for a new column
     */
    addColumnDiv() {
        let div = document.createElement('div');
        div.setAttribute('class', styles.column);
        let innerDiv = document.createElement('div');
        innerDiv.setAttribute('class', styles.innercolumn);
        div.appendChild(innerDiv);

        this.columnDivs.push(div);
        this.frame.appendChild(div);
    }

    /**
     * Creates the html element for a new box
     * @returns {Element}
     */
    createBoxDiv() {
        let div = document.createElement('div');
        div.setAttribute('class', styles.box);
        return div;
    }

    /**
     * Moved the html element to the correct parent
     */
    moveBoxDiv(box, column, row){
        let columnDiv = this.columnDivs[column];

        let innerDiv = columnDiv.firstChild;
        if (!innerDiv.children || innerDiv.children.length <= row)
            innerDiv.appendChild(box.div);
        else
            innerDiv.insertBefore(box.div, innerDiv.children[row + 1]);
    }
}