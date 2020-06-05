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

let imagesChanged = false;

$(document).ready(function() {
    $('input[type="file"]').change(function(e){
        let targetElement = document.getElementsByClassName("filePreview " + e.target.id)[0];
        let text = (e.target.files.length > 1) ? e.target.files.length + " files selected" : e.target.files[0].name;
        targetElement.innerText = text;
        imagesChanged = true;
    });
});

function previewImages() {
    if (imagesChanged) {
        let content = document.getElementById('imagePreviewContent');
        content.innerHTML = "";
        let images = document.getElementById('images').files;
        if (images.length == 0) {
            let hdr = document.createElement("div");
            hdr.className = "ui header";
            hdr.innerText = "No images were selected yet!"
            content.appendChild(hdr);
        }

        else {
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

            for (let image of images) {
                let img = document.createElement("img");
                img.className = "ui " + size + " image";
                img.style = "display:inline-block;";
                img.src = window.URL.createObjectURL(image);
                img.alt = image.name;
                img.title = image.name;
                if (images.length > 1) img.onclick = function(){previewImage(this.src, this.alt);};
                content.appendChild(img);
            }
        }
    }

    $('.ui.preview.modal')
        .modal('show');
    imagesChanged = false;
}

function previewImage(src, name) {
    document.getElementById("imagePreview").src = src;
    document.getElementById('ImagePreviewText').textContent = name;
    $('.ui.individualPreview.modal')
        .modal({allowMultiple: true})
        .modal('show');
    closeModal('preview');
}

function closeModal(modalUniqueClass) {
    if (modalUniqueClass === 'individualPreview') {$('.ui.preview.modal').modal('show');}
    $('.ui.modal.' + modalUniqueClass)
        .modal('hide');
}