/**
 * Default visualization, extend this class to implement a visualization
 * @property {Box} box
 */
class Visualization {
    constructor(box, title) {
        this.box = box;
        this.setTitle(title)
    }

    /**
     * Sets the box title for this visualization
     * @param {string} title
     */
    setTitle(title){
        this.box.title.textContent = title;
    }

    /**
     * Called right before this visualization gets removed
     */
    onRemoved(){};
}
