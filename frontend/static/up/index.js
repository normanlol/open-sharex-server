document.getElementById("scriptReq").style.display = "";

function upload() {
    document.getElementById("success").style.display = "none";
    document.getElementById("failed").style.display = "none";
    document.getElementById("progDiv").style.display = "";
    document.getElementById("prog").innerHTML = "Formatting...";
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append("file", document.getElementById("file").files[0]);
    xhr.open("POST", "/upload");
    if (document.getElementById("auth")) {
        xhr.setRequestHeader("authentication", document.getElementById("auth").value);
    }
    document.getElementById("prog").innerHTML = "Uploading and processing...";
    xhr.send(fd);
    xhr.onload = function() {
        document.getElementById("prog").innerHTML = "Finalizing...";
        var j = JSON.parse(xhr.responseText);
        if (j.success == true) {
            document.getElementById("success").style.display = "";
            document.getElementById("progDiv").style.display = "none";
            document.getElementById("fileViewer").src = "/" + j.id;
            document.getElementById("link").href = "/" + j.id;
            document.getElementById("htmlLink").href = "/view/" + j.id
            document.getElementById("delLink").href = "/d/?code=" + j.deleteKey;
        } else {
            document.getElementById("progDiv").style.display = "none";
            document.getElementById("failed").style.display = "";
            document.getElementById("err").innerHTML = j.err.message || j.err.code || j.err;
        }
    }
}