let selected_image = "";
let visualizations = {};
let userValues = [];
let selected_users = [];
//let edit = false;
let zoomValue = 50;

function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) {value ? registry.enable(key) : registry.disable(key);}
    //- Reset visualization type changes -//
    visualizations = {};

    properties.setImage(selected_image);
    properties.setColor(Object.values(RGBA));
    properties.setZoom(zoomValue);
    properties.setUsers(selected_users);
}

//- Read checkbox changes -//
function checkboxChanged(id) {
    let state = document.getElementById(id).checked
    visualizations[id] = state;
    if (id === 'attentionmap') {
        $(".accordion.colorsettings").accordion(state ? "open" : "close", 0);
    }  else if (id === 'editor') {
        $(".accordion.editorsettings").accordion(state ? "open" : "close", 0);
    }  else if (id === 'gazestripe') {
        $(".accordion.zoomsettings").accordion(state ? "open" : "close", 0);
    }
    //resizeBoxes()
}

//- Read image selector -//
function selectImage(image) {
    selected_image = image;
    updateUsers(image);
}

//- Update User Dropdown -//
function updateUsers(image) {
    let users = [];
    if(image) {
        let imageData = dataset.getImageData(image);
        for (let path of imageData.scanpaths) {
            users.push(path.person);
        }
    }

    users.sort();
    for (let user in users) {
        let value = {};
        value['name'] = user;
        value['value'] = user;
        value['selected'] = true;
        userValues.push(value);
    }
    $('.dropdown.search.selection.user')
        .dropdown('change values', userValues);
}

function usersAdd(addedUser) {
    console.log(addedUser)
    selected_users.push(addedUser);
    console.log('USERS SELECTED:'+ selected_users);
}

function usersRemove(removedUser) {
    console.log(removedUser)
    selected_users.pop(removedUser);
    console.log('USERS SELECTED:'+ selected_users);
}

//- RGBA Sliders handler
function readSlidersRGBA(id, value) {
	RGBA[id] = value;
    switch (id) {
        case 'r':
            $('.r-color-preview').css({"background-color":'rgba(' + RGBA[id] + ',' + 0 + ',' + 0 + ',' + 1 + ')'});
            break;
        case 'g':
            $('.g-color-preview').css({"background-color":'rgba(' + 0 + ',' + RGBA[id] + ',' + 0 + ',' + 1 + ')'});
            break;
        case 'b':
            $('.b-color-preview').css({"background-color":'rgba(' + 0 + ',' + 0 + ',' + RGBA[id] + ',' + 1 + ')'});
            break;
        case 'a':
            $('.a-color-preview').css({"background-color":'rgba(' + 0 + ',' + 0 + ',' + 0 + ',' + RGBA[id] + ')'});
            break;
    }
    $('.color-preview').css({"background-color":'rgba(' + Object.values(RGBA) +')'})
    if (Object.values(RGBA)[3] < 0.2 || Object.values(RGBA).slice(0,3).reduce(function sum(total, num) {return total + num;}, 0) > 500) {
        $('.color-preview').removeClass("inverted");
    } else {
        $('.color-preview').addClass("inverted");
    }
}

//- Zoom Lever Slider -//
function readSlidersZoom(value) {
    zoomValue = value;
}


/*
function editorMode(mode) {
    edit = mode == "edit" ? true : false;
    if (edit) {
        $('.editorEdit').addClass('positive')
        $('.editorDrag').removeClass('positive')
        //EDIT MODE ENABLED (use this for any function calls)
    } else {
        $('.editorDrag').addClass('positive')
        $('.editorEdit').removeClass('positive')
        //EDIT MODE DISABLED (use this for any function calls)
    }
}
*/

function showHelp() {
    $('#show_help').toggleClass('green basic')
    $('.settinghelp').toggleClass('hidden')
}