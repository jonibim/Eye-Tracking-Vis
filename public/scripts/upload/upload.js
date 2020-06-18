window.onload = () => {
    document.getElementById('datasetForm').addEventListener('submit', handleFormSubmit);
}

function handleFormSubmit(event) {
    event.preventDefault();

    let request = new XMLHttpRequest();

    request.onload = () => {
        let json = JSON.parse(request.responseText);
        let status = json.status;

        document.getElementById('tempSection').style.display='none';

        if(status === 400){
            document.getElementById('successSection').style.display='none';
            document.getElementById('failureSection').style.display='';

            document.getElementById('failureMessage').textContent = json.message;
        }
        else if(status === 200){
            document.getElementById('failureSection').style.display='none';
            document.getElementById('successSection').style.display='';

            document.getElementById('visualizationButton').setAttribute('href','/visualization?id=' + json.id);
        }
    }

    request.open('post','/dataset/upload');
    request.send(new FormData(event.target));
}

//- Used to Detect Changes in Images, Prevent Some Unnecessary Loading of Images -//
let imagesChanged = false;

//- Set Labels Next to Selection Buttons to Show Selected File(s) -//
$(document).ready(function() {
    //- Detect Input Change -//
    $('input[type="file"]').change(function(e){
        let targetElement = document.getElementsByClassName("filePreview " + e.target.id)[0];
        //- Detect Single or Multiple Files -//
        let text = (e.target.files.length > 1) ? e.target.files.length + " files selected" : e.target.files[0].name;
        targetElement.innerText = text;
        //- Images Changed if Image Input Changed -//
        if (e.target.id === "images") imagesChanged = true;
    });
});

//- Set Labels Next to Selection Buttons to Show Selected File(s) -//
function previewImages() {
    //- Only if Images Changed, Update Content -//
    if (imagesChanged) {
        //- Clear Content and Get Images -//
        let content = document.getElementById('imagePreviewContent');
        content.innerHTML = "";
        let images = document.getElementById('images').files;
        //- Set Message if no Images Are Selected -//
        if (images.length == 0) {
            let hdr = document.createElement("div");
            hdr.className = "ui header";
            hdr.innerText = "No images were selected yet!"
            content.appendChild(hdr);
        }

        //- Set Content for Selected Images -//
        else {
            //- Define Size of Image Preview Thumbnails -//
            let images = document.getElementById('images').files;
            let size = undefined;
            if (images.length < 2) {
                size = "big";
            } else if (images.length < 3) {
                size = "large";
            } else if (images.length < 7) {
                size = "medium";
            } else if (images.length < 35) {
                size = "small";
            } else if (images.length < 100) {
                size = "tiny";
            } else {
                size = "mini";
            }

            //- Set Attributes for each Image -//
            for (let image of images) {
                let img = document.createElement("img");
                img.className = "ui " + size + " image";
                img.style = "display:inline-block;";
                img.src = window.URL.createObjectURL(image);
                img.alt = image.name;
                img.title = image.name;
                //- If there is more than one Image Selected, Allow Individual Previews on Click -//
                if (images.length > 1) img.onclick = function(){previewImage(this.src, this.alt);};
                content.appendChild(img);
            }
        }
    }

    //- Show Modal -//
    $('.ui.preview.modal')
        .modal('show');
    //- Reset Images Changed Tracker to False -//
    imagesChanged = false;
}

//- Set Labels Next to Selection Buttons to Show Selected File(s) -//
function previewImage(src, name) {
    //- Set Image Source and Modal Header -//
    document.getElementById("imagePreview").src = src;
    document.getElementById('ImagePreviewText').textContent = name;
    //- Show Individual Image Preview Modal -//
    $('.ui.individualPreview.modal')
        .modal({allowMultiple: true})
        .modal('show');
    //- Close Multiple Image Preview Modal -//
    closeModal('preview');
}

//- Close Modal Based on Unique Class -//
function closeModal(modalUniqueClass) {
    //- If Individual Image Preview is Closed -> Reopen Multiple Image Preview -//
    if (modalUniqueClass === 'individualPreview') {$('.ui.preview.modal').modal('show');}
    //- Close Selected Modal -//
    $('.ui.modal.' + modalUniqueClass)
        .modal('hide');
}