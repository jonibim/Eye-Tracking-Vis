let vis_count = 0;
let eye_cloud = true;
let gaze_stripes = true;
let transition_graph = true;
let visual_attention_map = true;
let grid = [[0,0], [0,1], [1,0], [1,1]];

function applySettings() {
    vis_count = 0;
    //- Read Visualization Types and Count -//
    $('input.settings.visualization_type[type="checkbox"]').each(function() {
        if ($(this).is(":checked") == true) {
            vis_count++;
        };
        //- Handle the checkboxes -//
        switch (this.id) {
        case "eye_cloud":
            eye_cloud = $(this).is(":checked");
            break;
        case "gaze_stripes":
            gaze_stripes = $(this).is(":checked");
            break;
        case "transition_graph":
            transition_graph = $(this).is(":checked");
            break;
        case "visual_attention_map":
            $(this).is(":checked") ? registry.enable('attentionmap') : registry.disable('attentionmap');
            break;
        };
    });

    console.log("Number of visualizations selected: " + vis_count); //Debugging Print
    //- Read Visualization Parameters -//

    // for (i=0; i<vis_count; i++) {
    //     let box = boxManager.addBox(grid[i]);
    //     new ExampleVisualization(box, 12);
    // };
}