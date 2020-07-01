let fs = require('fs');

/**
 * Gets the size of the given file or directory
 * @param path
 */
async function removeDir(path) {
    return new Promise((resolve, reject) => {
        fs.lstat(path, async (err, stats) => {
            if(err)
                reject(err);

            if (stats.isDirectory()) {
                let files = fs.readdirSync(path, {withFileTypes: true}).map(file => path + '/' + file.name);
                for(let file of files)
                    await removeDir(file);
                // wait for 100 ms, because removing directories doesn't get processed immediately
                await new Promise((resolve1, reject1) => setTimeout(() => resolve1(), 100));
                fs.rmdirSync(path);
            }
            else
                fs.unlinkSync(path);

            resolve();
        });
    });
}

module.exports = removeDir;