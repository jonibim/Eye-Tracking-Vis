//****************** Set default values ******************//
let RGBA = { 'r': 255, 'g': 0, 'b': 0, 'a': 1 }

let settingHelpMap = {
    'Visualizations': 'Select the visualizations/viewports to display',
    'Image': 'Select the image to display',
    'Users': 'Select the users to display',
    'Color': 'Modify the fixation color of the Attention Map <br> and the accent color of the Eye Cloud and Gaze Stripe .',
    'AOI Editor': 'Read the navigation commands for the AOI editor',
    'Gaze Stripes': 'Modify the zoom level of the thumbnails in the Gaze Stripes',
    'Eye Cloud': 'Modify the Eye Cloud Constants. <br> Point Range is the range in which points are aggregated into a single circle. <br> Radius is the min. and max. values for the circles\' radius. <br> Max Circles is the max. amount of circles to be displayed at once.'
}

//- Update Dataset Dropdown with default value -//
updateDatasets()

//- Update Zoom Slider with default value -//
let defaultZoomValue = 50;
readSlidersZoom(defaultZoomValue)

//- Initialize State of RGBA sliders -//
for ([x, y] of Object.entries(RGBA)) {
    readSlidersRGBA(x, y);
}

//****************** Define Settings Functions ******************//

function showEditorCommands() {
    openSettings();
    $('.ui.accordion.editorsettings').accordion('open', 0);
    let editorCommands = document.getElementsByClassName('accordion editorsettings')[0];
    editorCommands.scrollIntoView(true);
}

function showUserSettings() {
    openSettings();
    $('.ui.accordion.usersettings').accordion('open', 0);
    let userSettings = document.getElementsByClassName('accordion usersettings')[0];
    userSettings.scrollIntoView(true);
    $('.ui.dropdown.user').dropdown('show');
}

function showEyeCloudSettings() {
    openSettings();
    $('.ui.accordion.eyecloudsettings').accordion('open', 0);
    let eyecloudsettings = document.getElementsByClassName('accordion eyecloudsettings')[0];
    eyecloudsettings.scrollIntoView(true);
}

function showGazeStripeSettings() {
    openSettings();
    $('.ui.accordion.zoomsettings').accordion('open', 0);
    let zoomsettings = document.getElementsByClassName('accordion zoomsettings')[0];
    zoomsettings.scrollIntoView(true);
}

//- Update the Dataset Dropdown Options -//
async function updateDatasets() {
    const url = '/dataset/available';
    const request = fetch(url, { method: 'GET' });
    await request.then(response => response.arrayBuffer()).then(buffer => {
        let decoder = new TextDecoder("utf8");
        let data = decoder.decode(buffer);
        let datasets = JSON.parse(data);

        let values = [];
        for (let dataset of datasets) {
            let datasetValues = {};
            datasetValues['name'] = dataset['name'];
            datasetValues['value'] = dataset['id'];
            datasetValues['selected'] = datasetId === dataset['id'];
            values.push(datasetValues);
        }
        $('.dropdown.search.selection.dataset')
            .dropdown({
                values: values,
                selectOnKeydown: false,
                forceSelection: false,
                fullTextSearch: 'exact',
                //-minCharacters: 3,-// Causes a strange bug, just ignore this :)
                match: 'both',
                onChange: function (value) {
                    selectDataset(value);
                }
            });
    });
}

//- Display Help Toast Per Setting -//
function settingHelp(setting) {
    $('.toast.settingHelp')
        .toast('close')
    $('body')
        .toast({
            showIcon: 'info',
            title: setting + ' Setting(s)',
            displayTime: 20000,
            message: settingHelpMap[setting],
            class: 'info settingHelp',
            position: 'top center',
            closeIcon: true,
            compact: false
        });
}

//- Auto Apply Behavior -//
function settingChanged() {
    if ($('input#auto_apply[type="checkbox"]').is(":checked")) {
        applySettings()
    };
};

//- Prevent Users Update Spam -//
userTimer = undefined
function usersChanged() {
    $('#usersLoadingIcon').removeClass()
    $('#usersLoadingIcon').addClass("ui sync alternate loading icon");
    if (userTimer !== undefined) {
        clearTimeout(userTimer)
    }
    userTimer = setTimeout(function () {
        $('#usersLoadingIcon').removeClass()
        $('#usersLoadingIcon').addClass("ui users icon");
        settingChanged();
    }, 500);
}

//- Set Value of Slider -//
function setSlider(uclass, value) {
    $('.slider.'+uclass).slider('set value', value);
}

//****************** Set Element Behaviors/States ******************//

//- Detect checkbox update -//
$('input.settings')
    .click(function () {
        checkboxChanged(this.id);
        settingChanged();
    });

//- Image Dropdown -//
$('.dropdown.search.selection.image')
    .dropdown({
        selectOnKeydown: false,
        forceSelection: false,
        fullTextSearch: 'exact',
        match: 'both',
        onChange: function (value, text) {
            selectImage(text);
            settingChanged();
        },
        onShow: function () {
            $('#frame').dimmer('show');
        },
        onHide: function () {
            $('#frame').dimmer('hide');
        }
    });

//- Image Preview Source on Dropdown MouseOver and KeyDown (Arrow Up/Down or Page Up/Down) -//
$('.image-selector')
    .on('mouseenter', function (evt) {
        $('#preview-image').attr("src", dataset.url + "/images/" + $(this).text());
    });
$('.dropdown.search.selection.image .menu')
    .on('mouseleave', function (evt) {
        if ($('.image-selector.selected').length) {
            $('#preview-image').attr("src", dataset.url + "/images/" + $('.image-selector.selected').text());
        }
    });
document.onkeydown = function (e) {
    if ($('.dropdown.search.selection.image').hasClass('active')) {
        setTimeout(function () {
            if ($('.image-selector.selected').length) {
                $('#preview-image').attr("src", dataset.url + "/images/" + $('.image-selector.selected').text());
            }
        }, 100)
    }
};

//- Image Preview Dimmer Behavior -//
$('#frame').dimmer({ duration: 0 });

//- User Dropdown -//
$('.dropdown.search.selection.user')
    .dropdown({
        fullTextSearch: 'exact',
        forceSelection: false,
        onAdd: function (addedValue, addedText) {
            usersAdd(addedText);
            usersChanged();
        },
        onRemove: function (removedValue, removedText) {
            usersRemove(removedText);
            usersChanged();
        },
        onLabelSelect: function (label) {
            let $label = $(label)
            $label.parent('.ui.multiple.dropdown')
                .dropdown('remove selected', $label.data('value'));
            if (label !== undefined) {
                usersRemove(label.text);
                usersChanged();
            }
        }
    });

//- Clear User Dropdown Button -//
$('.clear.button')
    .on('click', function () {
        $('.dropdown.search.selection.user')
            .dropdown('clear');
        settingChanged();
    });

//- Select All User Dropdown Button -//
$('.add.button')
    .on('click', function () {
        enableAllUsers();
        settingChanged();
    });

//- RGB Slider initialization -//
$('.ui.slider.rgb')
    .each(function () {
        $('#' + this.id).slider({
            min: 0,
            max: 255,
            start: RGBA[this.id],
            step: 1,
            onChange: function (value) {
                readSlidersRGBA(this.id, value)
                settingChanged()
            }
        });
    });

//- Zoom Level Slider -//
$('.zoom-preview').val(defaultZoomValue);
$('.ui.slider.zoom')
    .slider({
        min: 25,
        max: 200,
        start: defaultZoomValue,
        step: 1,
        onChange: function (value) {
            readSlidersZoom(value)
            settingChanged()
        }
    });

//- Range Eye Cloud Slider -//
readEyeCloudSliders("pointrange", 150);
$('.ui.slider.pointrange')
    .slider({
        min: 50,
        max: 250,
        start: 150,
        step: 1,
        onChange: function (value) {
            readEyeCloudSliders("pointrange", value)
            settingChanged()
        }
    });

//- Radius Eye Cloud Slider -//
readEyeCloudSliders("minradius", 10);
readEyeCloudSliders("maxradius", 100);
$('.ui.slider.radius')
    .slider({
        min: 10,
        max: 250,
        start: 10,
        end: 100,
        step: 1,
        onChange: function (value, min, max) {
            readEyeCloudSliders("minradius", min)
            readEyeCloudSliders("maxradius", max)
            settingChanged()
        }
    });

//- Maximum Circles Eye Cloud Slider -//
readEyeCloudSliders("maxcircles", 100);
$('.ui.slider.maxcircles')
    .slider({
        min: 1,
        max: 100,
        start: 100,
        step: 1,
        onChange: function (value) {
            readEyeCloudSliders("maxcircles", value)
            settingChanged()
        }
    });


//- Save Configuration -//
function saveSettingsImageWarning() {
    $('.toast.ImageSaveWarning')
        .toast('close')
    $('body')
        .toast({
            showIcon: 'exclamation mark',
            title: "Warning!",
            displayTime: 0,
            message: "This option makes the current settings available for other images. However, these settings may not work properly for images with different dimensions or users. It is best to use settings for images with the same properties (such as comparing a colored image with a gray image)",
            class: 'error ImageSaveWarning',
            position: 'top center',
            closeIcon: true
        });
}


$("#saveSettings").click(() => {

    if ($("#snapCheck").checkbox('is checked')) {
        $("#submitRequest").html(`<i class="i file code icon"></i> Download ZIP`)
    }

    checkButtons()

    d3.select("#previewImage").attr("src", dataset.url + "/images/" + properties.getCurrentImage());
    d3.select("#previewImageLabel").text(properties.getCurrentImage())
    if (datasetId !== 'default') {
        d3.select("#previewId").html(
            `<i class='exclamation yellow triangle icon'></i> This data wil be available only for the dataset with id <br> <b> ${datasetId} </b>`)
    } else {
        d3.select("#previewId").html(
            `<i class='exclamation yellow triangle icon'></i> This data wil be available only for the <b> default </b> dataset`)
    }
    $('#modalSave')
        .modal('show');
});

function checkButtons() {
    if ($("#snapCheck").checkbox('is unchecked') &&
        $("#usersCheck").checkbox('is unchecked') &&
        $("#aoiCheck").checkbox('is unchecked') &&
        $("#colorCheck").checkbox('is unchecked') &&
        $("#zoomCheck").checkbox('is unchecked')) {
        $("#submitRequest").addClass("disabled")
    }
}

$("#usersCheck").checkbox({
    onChecked: function () {
        $("#submitRequest").removeClass("disabled")
    },
    onChange: function () {
        checkButtons()
    }
})

$("#aoiCheck").checkbox({
    onChecked: function () {
        $("#submitRequest").removeClass("disabled")
    },
    onChange: function () {
        checkButtons()
    }
})

$("#colorCheck").checkbox({
    onChecked: function () {
        $("#submitRequest").removeClass("disabled")
    },
    onChange: function () {
        checkButtons()
    }
})

$("#zoomCheck").checkbox({
    onChecked: function () {
        $("#submitRequest").removeClass("disabled")
    },
    onChange: function () {
        checkButtons()
    }
})

$("#snapCheck").checkbox({
    onUnchecked: function () {
        $("#submitRequest").html(`<i class="i file code icon"></i> Download JSON`)
        checkButtons()
    },
    onChecked: function () {
        $("#submitRequest").html(`<i class="i file code icon"></i> Download ZIP`)
        $("#submitRequest").removeClass("disabled")
        checkButtons()
    }
})

$("#submitRequest").click(() => {

    var dimmer = d3.select('#modalSave')
        .append('div')
        .attr('id', 'settingsDimmer')
        .attr('class', 'ui active dimmer')

    var loader = dimmer.append('div')
        .attr('id', 'settingsLoader')
        .attr('class', 'ui indeterminate text loader')
        .text('Exporting settings. This may take a while for the snapshots')

    var errnoFlag = 0

    try {

        var jsonExport = {}

        jsonExport.id = datasetId

        if ($("#imageCheck").checkbox('is unchecked')) {
            jsonExport.image = properties.getCurrentImage()
        }
        if ($("#usersCheck").checkbox('is checked')) {
            jsonExport.user = properties.getCurrentUsers()
        }

        if ($("#aoiCheck").checkbox('is checked') && properties.getCurrentAOISize !== 0) {
            jsonExport.aoi = JSON.decycle(properties.getCurrentAOI())
        }
        if ($("#colorCheck").checkbox('is checked')) {
            jsonExport.color = properties.getCurrentColor()
        }
        if ($("#zoomCheck").checkbox('is checked')) {
            jsonExport.zoom = properties.getCurrentZoom()
        }

        var convertString = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonExport))

        //Eye Cloud is not working with this 
        // because of the way it is implemented

        if ($("#snapCheck").checkbox('is unchecked')) {
            setTimeout(() => {
                if (dimmer && !errnoFlag) d3.select('#settingsDimmer').remove()
            }, 0);
        }

        //Start creation of zip file
        if ($("#snapCheck").checkbox('is checked')) {
            (async () => {
                var zip = new JSZip();
                zip.file("settings.json", JSON.stringify(jsonExport));
                var folder = zip.folder('images')

                for (let viz of registry.map.values())
                    if (viz.instance)
                        folder.file(viz.tag + '.png', await createSVGImageData(viz.instance.svg.node()));

                zip.generateAsync({type: "blob"})
                    .then(function (content) {
                        setTimeout(() => {
                            //Using FileSaver.js module
                            saveAs(content, "export.zip");
                            if (dimmer && !errnoFlag) d3.select('#settingsDimmer').remove();
                        }, 0);
                    });
            })();
        }
        else {
            var prepareDownload = document.createElement('a');
            prepareDownload.setAttribute("href", convertString);
            prepareDownload.setAttribute("download", "settings.json");
            prepareDownload.setAttribute("style", "display:none");
            document.body.appendChild(prepareDownload);
            prepareDownload.click();
            prepareDownload.remove();
        }




    }
    catch (err) {

        errorFlag = 1

        d3.select('#settingsLoader').remove()

        var content = d3.select('#settingsDimmer')
            .append('div')
            .attr('class', 'contnet')
            .append('h2')
            .attr('class', 'ui red icon header')

        content.append('i')
            .attr('class', 'exclamation circle icon')

        content.append('div')
            .text('An error occured')
        content.append('div')
            .attr('style', 'font-size: 16px; color:white')
            .text('Error Messaage: ' + err.message)
        content.append('button')
            .attr('class', 'ui red small button')
            .text('ok')
            .on('click', () => (
                d3.select('#settingsDimmer').remove()
            ))
        console.log(err.stack)


    }

});

//- Upload Configuration -//

let dropArea = document.getElementById('drop-area')

    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
    })

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
})

    ;['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false)
    })

function highlight(e) {
    dropArea.classList.add('highlight')
}

function unhighlight(e) {
    dropArea.classList.remove('highlight')
}

dropArea.addEventListener('drop', handleDrop, false)

let $result = $("#result");

function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files

    handleFiles(files)
}

function handleFiles(files) {
    if (files.length !== 1) {
        fakelog("ERROR: You can't upload more than two files")
        fakelog("=== END OF RUN ===")
        showError()
        return
    }
    ([...files]).forEach(handleFile)
}

function handleFile(f) {

    $('#dimmerLoader').remove()

    d3.select('#drop-area').append('div')
        .attr('id', 'dimmerLoader')
        .attr('class', 'ui active dimmer')

    d3.select('#dimmerLoader').append('div').attr('class','ui loader').attr('id','loader')

    let jsonSetting

    let $title = $("<h4>", {
        text: f.name
    });

    var $fileContent = $("<ul>");
    $result.append($title);
    $result.append($fileContent);


    if (f.type === 'application/zip') {
        var dateBefore = new Date();
        var count = 0
        JSZip.loadAsync(f)
            .then(function (zip) {
                var dateAfter = new Date();
                $title.append($("<span>", {
                    "class": "small",
                    text: " (loaded in " + (dateAfter - dateBefore) + "ms)"
                }));


                zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
                    var filenameOriginal = zipEntry.name
                    var filenameRegEx = zipEntry.name
                    if (zipEntry.name.match('[^/]+$'))
                        filenameRegEx = zipEntry.name.match('[^/]+$')[0]
                    if (filenameRegEx === 'settings.json') count++
                    if (count > 1) {
                        filenameOriginal = filenameOriginal + " <--- There is another setting file"
                    }
                    $fileContent.append($("<li>", {
                        text: filenameOriginal
                    }));

                });


                if (count === 1) {
                    zip.files['settings.json'].async("string")
                        .then(function (data) {
                            try {
                                jsonSetting = JSON.parse(data)
                                fakelog("INFO: Found settings with the following attributes: <br>" + data)
                                prepareJSON(jsonSetting)
                            } catch (err) {
                                fakelog('ERROR: Invalid JSON file')
                                fakelog('ERROR :' + err.message)
                                fakelog('==== END OF RUN ====')
                                showError()
                                return
                            }
                        });
                } else if (count === 0) {
                    fakelog('ERROR: There are no settings.json in the zip file')
                    fakelog('==== END OF RUN ====')
                    showError()
                    return
                } else {
                    fakelog('ERROR: There is more than one settings.json in the zip')
                    fakelog('==== END OF RUN ====')
                    showError()
                    return
                }


            }, function (e) {
                fakelog("ERROR: Error reading " + f.name + ": " + e.message)
                fakelog('==== END OF RUN ====')
                showError()
                return
            });
    } else if (f.type === 'application/json') {
        var reader = new FileReader();
        let result
        reader.onload = (e) => {
            jsonSetting = JSON.parse(e.target.result);
            prepareJSON(jsonSetting)
        }
        reader.readAsText(f)
    }
    else {
        fakelog("ERROR: Unsupported type" + f.type)
        fakelog('==== END OF RUN ====')
        showError()
        return
    }
}

function fakelog(inputText) {
    $result.append($("<div>", {
        html: inputText
    }));
}

function prepareJSON(JSONobject) {


    // $currentSettings = $("#currentSettings");
    // $newSettings = $("#newSettings")

    currentProps = {}
    currentProps.id = datasetId
    currentProps.image = properties.getCurrentImage()
    currentProps.user = properties.getCurrentUsers()
    currentProps.aoi = JSON.decycle(properties.getCurrentAOI())
    currentProps.color = properties.getCurrentColor()
    currentProps.zoom = properties.getCurrentZoom()

    fakelog('Checking properties... <br>')
    if (currentProps === JSONobject) {
        //throwError
        fakelog('ERROR: Uploaded object is the same as the current settings')
        fakelog('==== END OF RUN ====')
        showError()
        return
    }

    fakelog('Checking dataset ID... <br>')
    //Check for datasetID match
    if (JSONobject.id) {
        if (JSONobject.id !== datasetId) {
            //throwError 
            fakelog('ERROR: Dataset ID mismatch.')
            fakelog('INFO: Current dataset id: ' + datasetId)
            fakelog('INFO: Uploaded file dataset id: ' + JSONobject.id)
            fakelog('==== END OF RUN ====')
            showError()
            return
        }
    } else {
        fakelog('ERROR: No Dataset ID')
        fakelog('==== END OF RUN ====')
        showError()
        return
    }

    fakelog('Checking image... <br>')
    //Check for image restriction
    if (JSONobject.image) {
        if (JSONobject.image !== currentProps.image) {
            //throwError
            fakelog('ERROR: Image mismatch')
            fakelog('INFO: Current image: ' + currentProps.image)
            fakelog('INFO: Uploaded file image: ' + JSONobject.image)
            fakelog('==== END OF RUN ====')
            showError()
            return
        }
    }

    try {

        //Update Color
        fakelog('Quick apply... <br>')
        if (JSONobject.color) {
            fakelog('Setting colors...')
            fakelog('Current colors:')
            fakelog(currentProps.color)
            fakelog('New colors:')
            fakelog(JSONobject.color)
            fakelog('<br>')

            properties.setColor(JSONobject.color)
            readSlidersRGBA('r', JSONobject.color[0])
            $('r').slider('set value', JSONobject.color[0])
            readSlidersRGBA('g', JSONobject.color[1])
            $('g').slider('set value', JSONobject.color[1])
            readSlidersRGBA('b', JSONobject.color[2])
            $('b').slider('set value', JSONobject.color[2])
        } else {
            fakelog('Skipping color...')
            fakelog('<br>')

        }

        //Update Zoom
        fakelog('Setting zoom...')
        if (JSONobject.zoom) {
            fakelog('Current zoom:')
            fakelog(currentProps.zoom)
            fakelog('New zoom:')
            fakelog(JSONobject.zoom)
            fakelog('<br>')

            $('.ui.slider.zoom').slider('set value', JSONobject.zoom)
            readSlidersZoom(JSONobject.zoom)
        } else {
            fakelog('Skipping zoom...')
            fakelog('<br>')

        }



        //Update Users
        fakelog('Setting users...')
        if (JSONobject.user) {
            fakelog('Current users:')
            fakelog(currentProps.user)
            fakelog('New users:')
            fakelog(JSONobject.user)
            fakelog('<br>')

            modifyUsers(JSONobject.user)
        } else {
            fakelog('Skipping users...')
            fakelog('<br>')
        }


        //Update AOI
        if (JSONobject.aoi) {
            fakelog('Setting ' + JSONobject.aoi.length + ' aoi(s)')
            updateAOI = properties.onchange.get('upload').get('editor')
            JSONobject.aoi.forEach(aoi => {
                fakelog('Adding aoi ' + aoi.id)
                updateAOI(aoi.top, aoi.left, aoi.bottom, aoi.right)
            })
            fakelog('Syncing changes')
            for (let listener of properties.onchange.get('sync').values())
                listener();
        } else {
            fakelog('Skipping aois...')
            fakelog('<br>')
        }

        fakelog('=== SUCCESS ===')
        showSuccess()

    } catch (err) {
        fakelog("An error occured")
        fakelog(err.message)
        fakelog(err.stack)
        showError()
        return
    }

}

function showSuccess() {

    $('#loader').remove()

    d3.select('#dimmerLoader').append('div')
        .attr('class', 'content')
        .attr('id', 'dimmerContent')

    d3.select('#dimmerContent').append('h2')
        .attr('class', 'ui green icon header')
        .attr('id', 'dimmerText')

    d3.select('#dimmerText').append('i')
        .attr('class', 'check icon')

    d3.select('#dimmerText').append('div').text('Upload Successful!')

    d3.select('#dimmerContent').append('div').text('Click anywhere inside this box to close this message')

    $('#dimmerLoader').click(() => {
        $('#dimmerLoader').remove()
    })


}

function showError() {

    $('#loader').remove()

    d3.select('#dimmerLoader').append('div')
        .attr('class', 'content')
        .attr('id', 'dimmerContent')

    d3.select('#dimmerContent').append('h2')
        .attr('class', 'ui red icon header')
        .attr('id', 'dimmerText')

    d3.select('#dimmerText').append('i')
        .attr('class', 'times icon')

    d3.select('#dimmerText').append('div').text('Upload Failed!')

    d3.select('#dimmerContent').append('div').text('Check console for more information')

    d3.select('#dimmerContent').append('div').text('Click anywhere inside this box to close this message')

    $('#dimmerLoader').click(() => {
        $('#dimmerLoader').remove()
    })

}

$("#uploadSettings").click(() => {
    // checkToggle()
    $('#modalUpload')
        .modal('show');

});

// $('#togglePreview').click(() => {
//     $icon = $('#togglePreview').find('.icon')
//     if ($icon.hasClass("pencil")) {
//         $icon.removeClass("pencil ruler");
//         $icon.addClass("bolt");
//         $('#textLabel').text('Quick apply')
//     } else {
//         $icon.removeClass("bolt");
//         $icon.addClass("pencil ruler");
//         $('#textLabel').text('Preview mode')
//     }
//     checkToggle()
// })

// function checkToggle() {
//     if ($('#togglePreview').find('.icon').hasClass("pencil")) {
//         $('#previewContent').show()
//         $('#submitDownload').show()
//         $('#resetDownload').show()
//     } else {
//         $('#previewContent').hide()
//         $('#submitDownload').hide()
//         $('#resetDownload').hide()
//     }
// }

$("#clearLog").click(() => {
    $result.html('Log cleared')
})
