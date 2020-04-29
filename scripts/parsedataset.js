const csv2json = require('csvtojson')
const fileSystem = require('fs')
const tempDatasetFilePath = '../../testdataset/all_fixation_data_cleaned_up_TEMP.csv' // ALL FILE PATHS SHOULD BE DYNAMIC

/*
The first part creates a temporary copy of the uploaded csv-file, which has replaced each tab with a comma, so that
it can be read properly by the jsontocsv-module that is used to parse the csv-data.
 */

function readFile(file) {
        fileSystem.readFile('../../testdataset/all_fixation_data_cleaned_up.csv', 'utf8', function (err, data) {
                if (err) {
                        return console.log(err);
                }

                var result = data.replace(/\t/g, ',');

                fileSystem.writeFile(tempDatasetFilePath, result, 'utf8', function (err) {
                        if (err) {
                                return console.log(err);
                        }

                        /*
                        This part uses the jsontocsv-module to convert the proper, temporary csv-file to the json-syntax and
                        writes it to a file. It's called in the fs.writeFile callback, to make sure that the code below won't
                        run before the creation of the file. Finally, it removes the temporary csv-file.
                        */

                        fileSystem.exists('../../testdataset/all_fixation_data_cleaned_up_TEMP.csv', function (exists) {
                                if (exists) {
                                        csv2json().fromFile(tempDatasetFilePath).then((jsonArrayObject) => {
                                                fileSystem.writeFileSync("../../testdataset/all_fixation_data_cleaned_up.json",
                                                    JSON.stringify(jsonArrayObject, null, 1), 'utf-8');

                                                // Deletes the temporary csv-file after completing the writing

                                                fileSystem.unlink(tempDatasetFilePath, (err) => {
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
