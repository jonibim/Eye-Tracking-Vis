/**
 * @param {SVGElement} svg
 * @param {string} filename? - preferred name for the downloaded file
 * @return {HTMLImageElement}
 */
function downloadSVG(svg, filename = 'image'){
    parseImages(svg, () => {
        let xml = new XMLSerializer().serializeToString(svg);
        let url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(xml);

        let image = new Image();

        image.onload = function () {
            let canvas =  document.createElement('canvas');
            canvas.width = image.naturalWidth * 5;
            canvas.height = image.naturalHeight * 5;
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            let data = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

            // create a button just to set the file name
            let button = document.createElement('a');
            button.style.display = 'none';
            button.download = filename.endsWith('.png') ? filename : filename + '.png';
            button.href = data;
            // Firefox requires the button to be in the document
            document.body.appendChild(button);
            button.click();
            document.body.removeChild(button);
        };

        image.src = url;
    });
}

/**
 * @param {SVGElement} svg
 * @param {function(svg: SVGElement)} callback
 */
function parseImages(svg, callback){
    let namespace = 'http://www.w3.org/1999/xlink';

    // convert image to a dataURL
    let parseImage = (image) => {
        let img = new Image();

        img.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            image.setAttributeNS(namespace, 'href', canvas.toDataURL());

            left--;
            if (left === 0)
                callback(svg);
        };

        img.src = image.getAttributeNS(namespace, 'href');
    };

    // convert svg to a dataURL
    let parseSvg = (url, element) => {
        let request = new XMLHttpRequest();
        request.onload = () => {
            let response = request.responseText || request.response;
            let dataUrl = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(response);
            element.setAttributeNS(namespace, 'href', dataUrl);

            left--;
            if(left === 0)
                callback(svg);
        };
        request.onerror = () => parseImage(element);
        request.open('GET', url);
        request.send();
    };

    let images = svg.querySelectorAll('image');
    let left = images.length;

    // convert images which aren't in the correct format
    for (let image of images) {
        let href = image.getAttributeNS(namespace, 'href');

        if (href.indexOf('data:image') < 0){
            if(href.indexOf('.svg') > 0)
                parseSvg(href, image);
            else
                parseImage(image);
        }
        else{
            left--;
            if (left === 0)
                callback(svg);
        }
    }

    if (left === 0)
        callback(svg);
}