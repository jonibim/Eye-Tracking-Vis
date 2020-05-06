let red = green = blue = 127;
let alpha = 0.8;

$('.ui.slider').slider({
    min: 0,
    max: 255,
    start: 127,
    step: 1,
    onChange: function(value) {
        readSlidersRGBA(this.id, value)
    }
});

$('.alpha.ui.slider').slider({
    min: 0.1,
    max: 1,
    start: 0.8,
    step: 0.01,
    onChange: function(value) {
        readSlidersRGBA(this.id, value)
    }
});

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
    if ((((red+green+blue)*(alpha) > 400)) || (((red+green+blue)*(1-alpha) > 400))) {
        $('.color-preview').removeClass("inverted");
    } else {
        $('.color-preview').addClass("inverted");
    }
    console.log('rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')');
}

readSlidersRGBA('r', red);
readSlidersRGBA('g', green);
readSlidersRGBA('b', blue);
readSlidersRGBA('a', alpha);

function getRGBA() {
    return red, green, blue, alpha
}
