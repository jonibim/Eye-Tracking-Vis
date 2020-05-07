//****************** Set default values ******************//
let red = green = blue = 127;
let alpha = 0.8;

//****************** Define Settings Functions ******************//

selectImage(image); //Image is defined in visualization.pug (ctrl + f: setDefaultImageHere)

//- Initialize State of RGBA sliders -//
readSlidersRGBA('r', red);
readSlidersRGBA('g', green);
readSlidersRGBA('b', blue);
readSlidersRGBA('a', alpha);

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
$('.ui.slider').slider({
    min: 0,
    max: 255,
    start: 127,
    step: 1,
    onChange: function(value) {
        readSlidersRGBA(this.id, value)
        settingChanged()
    }
});

//- Alpha Slider initialization -//
$('.alpha.ui.slider').slider({
    min: 0.1,
    max: 1,
    start: 0.8,
    step: 0.01,
    onChange: function(value) {
        readSlidersRGBA(this.id, value)
        settingChanged()
    }
});