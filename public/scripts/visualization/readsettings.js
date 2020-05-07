let selected_image = "";
let visualizations = {};

function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) {value ? registry.enable(key) : registry.disable(key);}
    //- Reset visualization type changes -//
    visualizations = {};
    
    properties.setImage(selected_image);
    properties.setColor([red,green,blue,alpha]);
}

//- Read checkbox changes -//
function checkboxChanged(id) {
    visualizations[id] = document.getElementById(id).checked;
}

//- Read image selector -//
function selectImage(value) {
    selected_image = value;
}

//- RGBA Sliders handler
function readSlidersRGBA(id, value) {
    switch (id) {
        case 'r':
            red = value;
            $('.r-color-preview').css({"background-color":'rgba(' + red + ',' + 0 + ',' + 0 + ',' + 1 + ')'});
            break;
        case 'g':
            green = value;
            $('.g-color-preview').css({"background-color":'rgba(' + 0 + ',' + green + ',' + 0 + ',' + 1 + ')'});
            break;
        case 'b':
            blue = value;
            $('.b-color-preview').css({"background-color":'rgba(' + 0 + ',' + 0 + ',' + blue + ',' + 1 + ')'});
            break;
        case 'a':
            alpha = value;
            $('.a-color-preview').css({"background-color":'rgba(' + 0 + ',' + 0 + ',' + 0 + ',' + alpha + ')'});
            break;
    }
    $('.color-preview').css({"background-color":'rgba(' + red + ',' + green + ',' + blue + ',' + alpha +')'})
    if (((red+green+blue)*(alpha) > 400) || ((red+green+blue)*(1-alpha) > 400) || (alpha < 0.2)) {
        $('.color-preview').removeClass("inverted");
    } else {
        $('.color-preview').addClass("inverted");
    }
}