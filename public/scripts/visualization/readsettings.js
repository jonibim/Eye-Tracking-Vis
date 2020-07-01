//****************** Initialize Used Variables ******************//
let selected_image = "";
let visualizations = {};
let users = [];
let selected_users = [];
let zoomValue;
let ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles;

//******************** Define Used Functions ********************//

//- React on Dataset Selection Dropdown -//
function selectDataset(value) {
    if (value !== "") {
        if (value !== datasetId) {
            window.location.href = '/visualization?id=' + value;
        }
    }
}

//- Apply All Settings -//
function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) { value ? registry.enable(key) : registry.disable(key); }
    //- Reset visualization type changes -//
    visualizations = {};

    //- Update All Settings -//
    properties.setImage(selected_image);
    properties.setUsers(selected_users);
    properties.setColor(Object.values(RGBA));
    properties.setZoom(zoomValue);
    properties.setEyeCloudSettings(ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles);
    checkCat()
}

//- Cool Easter Egg -//
function checkCat() {
    if ($('div.box').length) {
        $('#cat').css('display', 'none')
    } else {
        $('#cat').css('display', '')
    }
}

//- Read Checkbox Changes -//
function checkboxChanged(id) {
    //- Get State Of Changed Checkbox -//
    let state = document.getElementById(id).checked
    //- Set this Visualization to the Correct Value in the Updated Visualizations Array -//
    visualizations[id] = state;
    //- Open/Close Corresponding Settings Panel(s) -//
    if (id === 'attentionmap') {
        if (!$('#eyecloud:checked').length > 0) {
            $(".accordion.colorsettings").accordion(state ? "open" : "close", 0);
        }
    } else if (id === 'eyecloud') {
        $(".accordion.eyecloudsettings").accordion(state ? "open" : "close", 0);
        if (!$('#attentionmap:checked').length > 0) {
            $(".accordion.colorsettings").accordion(state ? "open" : "close", 0);
        }
    } else if (id === 'editor') {
        $(".accordion.editorsettings").accordion(state ? "open" : "close", 0);
    } else if (id === 'gazestripe') {
        $(".accordion.zoomsettings").accordion(state ? "open" : "close", 0);
    }
    //- Resize Boxes -//
    resizeBoxes()
}

//- Read Image Dropdown -//
function selectImage(image) {
    selected_image = image;
    updateUsers(image);
}

//- Update User Dropdown Values -//
function updateUsers(image) {
    users = [];
    if (image) {
        //- Get All Users for the Selected Image -//
        let imageData = dataset.getImageData(image);
        for (let path of imageData.scanpaths) {
            users.push(path.person);
        }
    }
    //- Enable All Users for the Selected Image -//
    enableAllUsers();
}

//- Enable All Possible Users -//
function enableAllUsers() {
    //- Update User Dropdown Values -//
    users.sort((a, b) => { return Number(a.slice(1)) - Number(b.slice(1)); });
    let userValues = [];
    for (let user in users) {
        let value = {};
        value['name'] = users[user];
        value['value'] = users[user];
        value['selected'] = true;
        userValues.push(value);
    }
    $('.dropdown.search.selection.user')
        .dropdown('change values', userValues);
    //- Update the (De)Select All Buttons -//
    setUserSelectionButtons();
}

//- Modify Active Users -//
function modifyUsers(usersImport) {
    selected_users = []
    let rejected_users = []
    //Remove all the users
    $('.dropdown.search.selection.user')
        .dropdown('clear');

    for (var i = 0; i < usersImport.length; i++) {
        if (users.includes(usersImport[i])) {
            selected_users.push(usersImport[i])
        }
        else {
            rejected_users.push(usersImport[i])
        }
    }

    properties.setUsers(selected_users)
    $('.dropdown.search.selection.user').dropdown('set selected', selected_users)
}

//- Add Single User -//
function usersAdd(addedUser) {
    selected_users.push(addedUser);
    //- Update the (De)Select All Buttons -//
    setUserSelectionButtons();
}

//- Remove Single User -//
function usersRemove(removedUser) {
    //var updateVisualization = properties.onchange.get('hideUser').get('editor')
    // if (updateVisualization) updateVisualization(removedUser)
    for (user in selected_users) {
        if (selected_users[user] === removedUser) {
            selected_users.splice(user, 1);
        }
    }
    //- Update the (De)Select All Buttons -//
    setUserSelectionButtons();
}

//- Select All & Clear User Selection Buttons -//
function setUserSelectionButtons() {
    if (selected_users.length == 0) {                   //- No Users Selected -> Enable All -//
        $('.clear.button').addClass('disabled');
        $('.add.button').removeClass('disabled');
    } else if (selected_users.length == users.length) { //- All Users Selected -> Remove All -//
        $('.add.button').addClass('disabled');
        $('.clear.button').removeClass('disabled');
    } else {                                            //- Some Users Selected -> Enable & Remove All -//
        $('.clear.button').removeClass('disabled');
        $('.add.button').removeClass('disabled');
    }
}

//- RGB Sliders ChangeHandler -//
function readSlidersRGBA(id, value) {
    //- Update Setting Value -//
    RGBA[id] = value;
    //- Update Color Preview -//
    switch (id) {
        case 'r':
            $('.r-color-preview').css({ "background-color": 'rgba(' + RGBA[id] + ',' + 0 + ',' + 0 + ',' + 1 + ')' });
            break;
        case 'g':
            $('.g-color-preview').css({ "background-color": 'rgba(' + 0 + ',' + RGBA[id] + ',' + 0 + ',' + 1 + ')' });
            break;
        case 'b':
            $('.b-color-preview').css({ "background-color": 'rgba(' + 0 + ',' + 0 + ',' + RGBA[id] + ',' + 1 + ')' });
            break;
    }
    $('.color-preview').css({ "background-color": 'rgba(' + Object.values(RGBA) + ')' })
    //- Invert Color Preview for Bright Colors -//
    if (Object.values(RGBA).slice(0, 3).reduce(function sum(total, num) { return total + num; }, 0) > 500) {
        $('.color-preview').removeClass("inverted");
    } else {
        $('.color-preview').addClass("inverted");
    }
}

//- Zoom Lever Slider -//
function readSlidersZoom(value) {
    zoomValue = parseInt(value);
    $('.zoom-preview').val(value);
}

//- Eye Cloud Sliders -//
function readEyeCloudSliders(uclass, value) {
    //- Update Setting Value -//
    switch (uclass) {
        case 'pointrange':
            ecRange = parseInt(value);
            break
        case 'minradius':
            ecMinRadius = parseInt(value);
            break
        case 'maxradius':
            ecMaxRadius = parseInt(value);
            break
        case 'maxcircles':
            ecMaxCircles = parseInt(value);
            break
    }
    //- Update Value Preview -//
    $('.'+uclass+'-preview').val(value);
}

//- Read Slider Label Inputs -//
$(':input[type="number"]').change(function(){
    //- Update Sliders (This will Call onChange on the Slider) -//
    if (this.id === 'minradius') {
        //- Make Sure Range Properties are Respected -//
        let to = $('.slider.radius').slider('get thumbValue', 'second');
        if (this.value <= to) $('.slider.radius').slider('set rangeValue', this.value, to);
        else $('.slider.radius').slider('set rangeValue', to, to);
    } else if (this.id === 'maxradius') {
        //- Make Sure Range Properties are Respected -//
        let from = $('.slider.radius').slider('get thumbValue', 'first');
        if (this.value >= from) $('.slider.radius').slider('set rangeValue', from, this.value);
        else $('.slider.radius').slider('set rangeValue', from, from);
    } else {
        setSlider(this.id, this.value);
    }
});

//- Show Help Icons on Hover -//
$('.item.setting')
    //- On Mouse Enter -> Show -//
    .hover(function () {
        $(this).find('.settinghelp').removeClass("hidden");
    //- On Mouse Leave -> Hide -//
    }, function () {
        $(this).find('.settinghelp').addClass("hidden");
    });

//- Reset Setting Function -//
function resetSettings(setting) {
    //- Reset Gaze Stripe Slider To Default Value -//
    if (setting === "GazeStripe") {
        readSlidersZoom(defaultZoomValue);
        setSlider('zoom', defaultZoomValue);
    } else if (setting === "EyeCloud") {
        //- Reset Eye Cloud Sliders To Default Value -//
        readEyeCloudSliders("pointrange", defaultPointRange);
        setSlider('pointrange', defaultPointRange);
        readEyeCloudSliders("minradius", defaultMinRadius);
        readEyeCloudSliders("maxradius", defaultMaxRadius);
        $('.slider.radius').slider('set rangeValue', defaultMinRadius, defaultMaxRadius);
        readEyeCloudSliders("maxcircles", defaultMaxCircles);
        setSlider('maxcircles', defaultMaxCircles);
    }
    settingChanged();
}