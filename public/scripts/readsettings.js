let selected_image = "01_Antwerpen_S1.jpg";
let visualizations = {};


function applySettings() {
    //- Apply visualization type changes -//
    for ([key, value] of Object.entries(visualizations)) {value ? registry.enable(key) : registry.disable(key);}
    //- Reset visualization type changes -//
    visualizations = {};
    
    properties.setImage(selected_image);
}

//- Read image selector -//
function selectImage(value) {
    selected_image = value;
}

//- Read checkbox changes -//
function checkboxChanged(id) {
    visualizations[id] = document.getElementById(id).checked;
}