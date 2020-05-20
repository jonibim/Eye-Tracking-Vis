//****************** Set default values ******************//
let RGBA = {'r': 255, 'g': 0, 'b': 0, 'a': 1}

let settingHelpMap = {
    'Visualizations' : 'Enable the visualization types ',
    'Image' : '',
    'Color' : '',
}

//- Initialize State of RGBA sliders -//
for ([x, y] of Object.entries(RGBA)) {
    readSlidersRGBA(x, y);
}

selectImage(image); //Image is defined in visualization.pug (ctrl + f: setDefaultImageHere)

//****************** Define Settings Functions ******************//


function settingHelp(setting) {
    $('.toast').toast('close')
    $('body')
        .toast({
            showIcon: 'info',
            title: setting + ' setting',
            displayTime: 0,
            message: settingHelpMap[setting],
            class: 'info',
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

//****************** Set Element Behaviors/States ******************//

//- Detect checkbox update -//
$('input.settings')
    .click(function() {
        checkboxChanged(this.id);
        settingChanged();
    });    

//- Set Dropdown Function -//
$('.dropdown.search.selection')
    .dropdown({
        fullTextSearch: 'exact', 
        match: 'both',
        onChange: function(value,text) {
            selectImage(text);
            settingChanged();
        }
    });

//- Image Preview on Dropdown -//
$('.image-selector').on('mouseenter', function(evt){
    $('.preview').show();
    $('.inner-frame').hide();
    $('#preview-image').attr("src", "/testdataset/images/" + this.innerHTML);
    $(this).on('mouseleave', function(){
        $('.preview').hide();
        $('.inner-frame').show();
    });
});

//- RGB Slider initialization -//
$('.ui.slider.rgb').each(function() {
    $('#'+this.id).slider({
        min: 0,
        max: 255,
        start: RGBA[this.id],
        step: 1,
        onChange: function(value) {
            readSlidersRGBA(this.id, value)
            settingChanged()
        }
    });
});

//- Alpha Slider initialization -//
$('.alpha.ui.slider').slider({
    min: 0.1,
    max: 1,
    start: RGBA['a'],
    step: 0.01,
    onChange: function(value) {
        readSlidersRGBA(this.id, value)
        settingChanged()
    }
});

//- Zoom Level Slider -//
$('.ui.slider.zoom').slider({
        min: 25,
        max: 200,
        start: 50,
        step: 1,
        onChange: function(value) {
            readSlidersZoom(value)
            settingChanged()
        }
    });