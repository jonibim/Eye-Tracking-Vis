//****************** Set default values ******************//
let RGBA = { 'r': 255, 'g': 0, 'b': 0, 'a': 1 }

let settingHelpMap = {
    'Visualizations': 'Select the visualizations/viewports to display',
    'Image': 'Select the image to display',
    'Users': 'Select the users to display',
    'Color': 'Modify the color of the fixations on the Attention Map',
    'Editor': 'Instructs the navigation commands for the AOI editor',
    'Zoom': 'Modify the zoom level of the thumbnails in the Gaze Stripes'
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
            title: setting + ' Setting',
            displayTime: 5000,
            message: settingHelpMap[setting],
            class: 'info settingHelp',
            position: 'top center',
            closeIcon: true
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

//- Alpha Slider initialization -//
$('.alpha.ui.slider')
    .slider({
        min: 0.1,
        max: 1,
        start: RGBA['a'],
        step: 0.01,
        onChange: function (value) {
            readSlidersRGBA(this.id, value)
            settingChanged()
        }
    });

//- Zoom Level Slider -//
$('.zoom-preview').text(defaultZoomValue);
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

//- Save Configuration -//

$("#saveSettings").click(() => {

    if ($("#snapCheck").checkbox('is checked')) {
        $("#submitRequest").html(`<i class="i file code icon"></i> Download ZIP`)
    }

    checkButtons()

    d3.select("#previewImage").attr("src", dataset.url + "/images/" + properties.getCurrentImage());
    d3.select("#previewImageLabel").text(image)
    if (datasetId !== 'default') {
        d3.select("#previewId").html(
            `<i class='exclamation yellow triangle icon'></i> This data wil be available only for the dataset with id <br> <b> ${datasetId} </b>`)
    } else {
        d3.select("#previewId").html(
            `<i class='exclamation yellow triangle icon'></i> This data wil be available only for the <b> default </b> dataset`)
    }
    $('.ui.modal')
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

    var jsonExport = {}

    if ($("#imageCheck").checkbox('is unchecked')) {
        jsonExport.image = properties.getCurrentImage()
    }
    if ($("#usersCheck").checkbox('is checked')) {
        jsonExport.user = properties.getCurrentUsers()
    }

    if ($("#aoiCheck").checkbox('is checked')) {
        jsonExport.aoi = properties.getCurrentAOI()
    }
    if ($("#colorCheck").checkbox('is checked')) {
        jsonExport.color = properties.getCurrentColor()
    }
    if ($("#zoomCheck").checkbox('is checked')) {
        jsonExport.zoom = properties.getCurrentZoom()
    }

    var convertString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonExport))

    //Eye Cloud is not working with this 
    // because of the way it is implemented

    //Start creation of zip file
    if ($("#snapCheck").checkbox('is checked')) {
        var zip = new JSZip();
        zip.file("settings.json", convertString);
        var folder = zip.folder('images')

        // registry.map.forEach(viz => {
        //     console.log(viz.instance)
        //     if (viz.instance.svg)
        //         folder.file(viz.tag + '.png', createSVGImage(viz.instance.svg.node()))
        // });

        //Start to add files to the folder. The loop above does the same functionality
        // But i commented it out for debugging and i am using the lines below

        folder.file('gazestripe.png', createSVGImage(registry.map.get('gazestripe').instance.svg.node()))
        //folder.file('attentionmap.png', createSVGImage(registry.map.get('attentionmap').instance.svg.node()))
        //folder.file('editor.png', createSVGImage(registry.map.get('editor').instance.svg.node()))
        //folder.file('transitiongraph.png', createSVGImage(registry.map.get('transitiongraph').instance.svg.node()))

        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                //Using FileSaver.js module
                saveAs(content, "export.zip");
            });
    }
    else {
        var prepareDownload = document.createElement('a');
        prepareDownload.setAttribute("href", convertString);
        prepareDownload.setAttribute("download", "tesr.json");
        prepareDownload.setAttribute("style", "display:none");
        document.body.appendChild(prepareDownload);
        prepareDownload.click();
        prepareDownload.remove();
    }

});


