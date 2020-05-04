/**
 * container for the visualization
 * @property {Element} div - the outer div element
 * @property {Element} title - the title element
 * @property {Element} inner - the inner div element, visualization stuff should be in here
 * @property {function(column: int, row: int)[]} onmove - listeners for when the box is moved
 */
class Box {

    /**
     * @param {Element} div - outer html element for the box
     */
    constructor(div) {
        this.div = div;

        this.title = document.createElement('div');
        this.title.className = 'title';
        this.div.appendChild(this.title);
        this.inner = document.createElement('div');
        this.inner.className = 'inner-box';
        this.div.appendChild(this.inner);

        this.onmove = [];
    }

    /**
     * Moves the box to the specified column and row
     * @param {int} column
     * @param {int} row
     */
    move(column,row){
        if(this.column === column && this.row === row)
            return;
        boxManager.removeBox(this);
        boxManager.addBox(this, column, row);
    }

    /**
     * Called when the box is moved
     * @param {int} column
     * @param {int} row
     */
    moved(column, row){
        this.column = column;
        this.row = row;
        for(let i = 0; i < this.onmove.length; i++)
            this.onmove[i](column, row);
    }

    /**
     * @returns {int} the width of the box
     */
    getWidth() {
        return boxManager.getBoxWidth(this);
    }

    /**
     * @returns {int} the height of the box
     */
    getHeight() {
        return boxManager.getBoxHeight(this);
    }
}