let fs = require('fs');

/**
 * Gets the size of the given file or directory
 * @param path
 */
async function readSizeRecursive(path) {
    return new Promise((resolve, reject) => {
        fs.lstat(path, async (err, stats) => {
            if(err)
                reject(err);

            let total = stats.size;

            if (stats.isDirectory()) {
                let files = fs.readdirSync(path, {withFileTypes: true}).map(file => path + '/' + file.name);
                for(let file of files)
                    total += await readSizeRecursive(file);
            }

            resolve(total);
        });
    });
}

module.exports = readSizeRecursive;