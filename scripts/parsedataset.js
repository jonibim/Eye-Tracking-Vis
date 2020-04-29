const csv2json = require('csvtojson')
const fileSystem = require('fs')

function readFile(filePath) { // filePath is the upload path of the uploaded file

        /*
        The first part creates a temporary copy of the uploaded csv-file, which has replaced each tab with a comma, so
        that it can be read properly by the jsontocsv-module that is used to parse the csv-data.
         */

        const tempDatasetPath = filePath.replace('.csv', '') + '_TEMP' + '.csv';
        const jsonPath = filePath.replace('.csv', '.json');

        fileSystem.readFile(filePath, 'utf8', function (err, data) {
                if (err) {
                        return console.log(err);
                }

                var result = data.replace(/\t/g, ',');

                fileSystem.writeFile(tempDatasetPath, result, 'utf8', function (err) {
                        if (err) {
                                return console.log(err);
                        }

                        /*
                        This part uses the jsontocsv-module to convert the proper, temporary csv-file to the json-syntax
                        and writes it to a file. It's called in the fs.writeFile callback, to make sure that the code
                        below won't run before the creation of the file. Finally, it removes the temporary csv-file.
                        */

                        fileSystem.exists(tempDatasetPath, function (exists) {
                                if (exists) {
                                        csv2json().fromFile(tempDatasetPath).then((jsonArrayObject) => {
                                                fileSystem.writeFileSync(jsonPath,
                                                    JSON.stringify(jsonArrayObject, null, 1), 'utf-8');

                                                // Deletes the temporary csv-file after completing the writing

                                                fileSystem.unlink(tempDatasetPath, (err) => {
                                                        if (err) {
                                                                return console.log(err);
                                                        }
                                                });
                                        })
                                }
                        });
                });
        });
}


module.exports = readFile;
