/**
 * @type {Map<any, any>}
 */
let urlDataMap = new Map();

/**
 * @param {SVGElement} svg
 * @param {string} [filename] - preferred name for the downloaded file
 * @return {HTMLImageElement}
 */
async function downloadSVG(svg, filename = 'image') {
    await parseImages(svg);
    let xml = new XMLSerializer().serializeToString(svg);
    let url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(xml);

    let image = new Image();

    image.onload = () => {
        let canvas = document.createElement('canvas');
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
}

/**
 * @param {SVGElement} svg
 * @return {Promise|undefined}
 */
async function createSVGImageData(svg) {
    await parseImages(svg);

    let xml = new XMLSerializer().serializeToString(svg);
    let url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(xml);

    return await new Promise((resolve, reject) => {
        let image = new Image();

        image.onload = async () => {
            let canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth * 5;
            canvas.height = image.naturalHeight * 5;
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            let data = canvas.toDataURL('image/png');
            resolve(await JSZipUtils.getBinaryContent(data));
        };

        image.src = url;
    });
}

/**
 * @param {SVGElement} svg
 */
async function parseImages(svg) {
    return new Promise(async (resolve, reject) => {
        let namespace = 'http://www.w3.org/1999/xlink';

        // convert image to a dataURL
        let parseImage = async (url, image) => {
            return new Promise((resolve1, reject1) => {
                let handle = dataUrl => {
                    image.setAttributeNS(namespace, 'href', dataUrl);
                    resolve1();
                };

                if(urlDataMap.has(url))
                    handle(urlDataMap.get(url));
                else {
                    let img = new Image();

                    img.onload = () => {
                        let canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        canvas.getContext('2d').drawImage(img, 0, 0);
                        let dataUrl = canvas.toDataURL();

                        urlDataMap.set(url, dataUrl);
                        handle(dataUrl);
                    };

                    img.src = url;
                }
            })
        };

        let images = svg.querySelectorAll('image');

        // convert images which aren't in the correct format
        for (let image of images) {
            let href = image.getAttributeNS(namespace, 'href');
            if (href.indexOf('data:image') < 0)
                await parseImage(href, image);
        }

        resolve(svg);
    })
}