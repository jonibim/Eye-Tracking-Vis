let selected_image = "01_Antwerpen_S1.jpg"

switchVis = (enabled, tag) => {
    enabled ? registry.enable(tag) : registry.disable(tag);
}

//- Read Image Selector -//
function selectImage(value) {
    if (selected_image != value) {
        selected_image = value;
        console.log(value);
    } else {
        console.log("Image did not change....");
    }
}