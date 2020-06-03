/**
 * Default visualization, extend this class to implement a visualization
 * @property {Box} box
 * @property {string} title
 * @property {string} classname - used to identify the container in HTML from javascript
 */
class Visualization {

    /**
     * @param {Box} box
     * @param {string} title
     * @param {string} classname - used to identify the container in HTML from javascript
     */
    constructor(box, title, classname) {
        this.box = box;
        this.setTitle(title,classname)
    }

    /**
     * Sets the box title for this visualization
     * @param {string} title
     * @param {string} classname - used to identify the container in HTML from javascript
     */
    setTitle(title, classname){
        this.box.title.textContent = title;
        this.box.inner.id = classname;
    }

    /**
     * Called right before this visualization gets removed
     */
    onRemoved(){};
}
