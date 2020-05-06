let selected_image = "01_Antwerpen_S1.jpg"

switchVis = (enabled, tag) => {
    enabled ? registry.enable(tag) : registry.disable(tag);
}

//- Read Image Selector -//
function selectImage(value) {
    properties.setImage(value);
}
