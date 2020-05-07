let selected_image = "";
let visualizations = {};

function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) {value ? registry.enable(key) : registry.disable(key);}
    //- Reset visualization type changes -//
    visualizations = {};
    
    properties.setImage(selected_image);
    properties.setColor(Object.values(RGBA));
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
	console.log(id, value);
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

