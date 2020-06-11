let selected_image = "";
let visualizations = {};
let users = [];
let selected_users = [];
let zoomValue;
let ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles;

//- React on Dataset Selection Dropdown -//
function selectDataset(value) {
    if (value !== "") {
        if (value !== datasetId) {
            window.location.href = '/visualization?id=' + value;
        }
    }
}

function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) { value ? registry.enable(key) : registry.disable(key); }
    //- Reset visualization type changes -//
    visualizations = {};

    properties.setImage(selected_image);
    properties.setUsers(selected_users);
    properties.setColor(Object.values(RGBA));
    properties.setZoom(zoomValue);
    properties.setEyeCloudSettings(ecRange, ecMinRadius, ecMaxRadius, ecMaxCircles);
    checkCat()
}

//- Cool easter egg -//
function checkCat() {
    if ($('div.box').length) {
        $('#cat').css('display', 'none')
    } else {
        $('#cat').css('display', '')
    }
}

//- Read checkbox changes -//
function checkboxChanged(id) {
    let state = document.getElementById(id).checked
    visualizations[id] = state;
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
    resizeBoxes()
}

//- Read image selector -//
function selectImage(image) {
    selected_image = image;
    updateUsers(image);
}

//- Update User Dropdown -//
function updateUsers(image) {
    users = [];
    if (image) {
        let imageData = dataset.getImageData(image);
        for (let path of imageData.scanpaths) {
            users.push(path.person);
        }
    }

    enableAllUsers();
}

//- Enable All Possible Users -//
function enableAllUsers() {
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
    setUserSelectionButtons();
}

//- Select All & Clear User Selection Buttons -//
function setUserSelectionButtons() {
    if (selected_users.length == 0) {
        $('.clear.button').addClass('disabled');
        $('.add.button').removeClass('disabled');
    } else if (selected_users.length == users.length) {
        $('.add.button').addClass('disabled');
        $('.clear.button').removeClass('disabled');
    } else {
        $('.clear.button').removeClass('disabled');
        $('.add.button').removeClass('disabled');
    }
}

//- RGBA Sliders handler
function readSlidersRGBA(id, value) {
    RGBA[id] = value;
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
        case 'a':
            $('.a-color-preview').css({ "background-color": 'rgba(' + 0 + ',' + 0 + ',' + 0 + ',' + RGBA[id] + ')' });
            break;
    }
    $('.color-preview').css({ "background-color": 'rgba(' + Object.values(RGBA) + ')' })
    if (Object.values(RGBA)[3] < 0.2 || Object.values(RGBA).slice(0, 3).reduce(function sum(total, num) { return total + num; }, 0) > 500) {
        $('.color-preview').removeClass("inverted");
    } else {
        $('.color-preview').addClass("inverted");
    }
}

//- Zoom Lever Slider -//
function readSlidersZoom(value) {
    zoomValue = value;
    $('.zoom-preview').text(value);
}

//- Eye Cloud Sliders -//
function readEyeCloudSliders(uclass, value) {
    switch (uclass) {
        case 'pointrange':
            ecRange = value
            break
        case 'minradius':
            ecMinRadius = value
            break
        case 'maxradius':
            ecMaxRadius = value
            break
        case 'maxcircles':
            ecMaxCircles = value
            break
    }
    $('.'+uclass+'-preview').text(value);
}

//- Show Help Icons on Hover -//
$('.item.setting')
    .hover(function () {
        $(this).find('.settinghelp').toggleClass("hidden");
    });