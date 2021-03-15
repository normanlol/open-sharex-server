document.getElementById("scriptReq").style.display = "";
if (window.location.search && window.location.search.split("code=").length > 1) {
    document.getElementById("dk").value = window.location.search.split("code=")[1].split("&")[0];
}

function del() {
    document.getElementById("prog").style.display = "";
    document.getElementById("prog").innerHTML = "Processing...";
    document.getElementById("success").style.display = "none";
    document.getElementById("failed").style.display = "none";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/delete/" + document.getElementById("dk").value);
    xhr.send();
    xhr.onload = function () {
        var j = JSON.parse(xhr.responseText);
        if (j.success == true) {
            document.getElementById("prog").style.display = "none";
            document.getElementById("success").style.display = "";
        } else {
            document.getElementById("prog").style.display = "none";
            document.getElementById("failed").style.display = "";
            document.getElementById("err").innerHTML = j.err.message || j.err.code || j.err;
        }
    }
}