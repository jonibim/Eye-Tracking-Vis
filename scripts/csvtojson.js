module.exports = string => {
    // remove any spaces
    string = string.trim().replace('\r','');

    // get field names from the first line
    let header = string.substring(0,string.indexOf('\n'));
    let fields = header.split(',');

    //
    let body = string.substring(string.indexOf('\n') + 1).split('\n');
    let entries = [];
    for(let lineNumber = 0; lineNumber < body.length; lineNumber++){
        let values = body[lineNumber].replace('\r','').split(',');

        // check if all fields are there
        if(values.length !== fields.length)
            throw {'err': 'Missing values at line ' + lineNumber + ', expected ' + fields.length + ', but found ' + values.length + '.'};

        // assign values to correct field names
        let entry = {};
        for(let number = 0; number < fields.length; number++)
            entry[fields[number]] = values[number];
        entries[lineNumber] = entry;
    }

    return entries;
}