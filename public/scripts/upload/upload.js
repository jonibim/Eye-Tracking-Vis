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

            document.getElementById('visualizationButton').href = '/visualization?id=' + json.id;
        }
    }

    // request.onerror = event => {
    //     console.err('upload.js - Http request gave an error: ', event);
    // }

    request.open('post','/dataset/upload');
    request.send(new FormData(event.target));
}