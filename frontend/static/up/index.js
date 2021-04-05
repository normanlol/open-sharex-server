document.getElementById("scriptReq").style.display = "";
if (localStorage.getItem("auth") && document.getElementById("auth")) {
    document.getElementById("auth").value = localStorage.getItem("auth");
}

function upload() {
    document.getElementById("success").style.display = "none";
    document.getElementById("failed").style.display = "none";
    document.getElementById("progDiv").style.display = "";
    document.getElementById("prog").innerHTML = "Formatting...";
    var xhr = new XMLHttpRequest();
    if (document.getElementById("file").files[0]) {
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
                if (localStorage.getItem("dk-mini-db")) {
                    var db = JSON.parse(localStorage.getItem("dk-mini-db"));
                    db.push({"id": j.id, "dk": j.deleteKey});
                    db = JSON.stringify(db);
                    localStorage.setItem("dk-mini-db", db);
                } else {
                    var db = [];
                    db.push({"id": j.id, "dk": j.deleteKey});
                    db = JSON.stringify(db);
                    localStorage.setItem("dk-mini-db", db);
                }
                if (document.getElementById("auth")) {localStorage.setItem("auth", document.getElementById("auth").value);}
            } else {
                document.getElementById("progDiv").style.display = "none";
                document.getElementById("failed").style.display = "";
                document.getElementById("err").innerHTML = j.err.message || j.err.code || j.err;
            }
        }
    } else if (document.getElementById("url").value !== "") {
        xhr.open("GET", "/upload?url=" + btoa(document.getElementById("url").value));
        if (document.getElementById("auth")) {
            xhr.setRequestHeader("authentication", document.getElementById("auth").value);
        }
        xhr.send();
        document.getElementById("prog").innerHTML = "Downloading to the server...";
        xhr.onload = function () {
            document.getElementById("prog").innerHTML = "Finalizing...";
            var j = JSON.parse(xhr.responseText);
            if (j.success == true) {
                document.getElementById("success").style.display = "";
                document.getElementById("progDiv").style.display = "none";
                document.getElementById("fileViewer").src = "/" + j.id;
                document.getElementById("link").href = "/" + j.id;
                document.getElementById("htmlLink").href = "/view/" + j.id
                document.getElementById("delLink").href = "/d/?code=" + j.deleteKey;
                if (localStorage.getItem("dk-mini-db")) {
                    var db = JSON.parse(localStorage.getItem("dk-mini-db"));
                    db.push({"id": j.id, "dk": j.deleteKey});
                    db = JSON.stringify(db);
                    localStorage.setItem("dk-mini-db", db);
                } else {
                    var db = [];
                    db.push({"id": j.id, "dk": j.deleteKey});
                    db = JSON.stringify(db);
                    localStorage.setItem("dk-mini-db", db);
                }
                if (document.getElementById("auth")) {localStorage.setItem("auth", document.getElementById("auth").value);}
            } else {
                document.getElementById("progDiv").style.display = "none";
                document.getElementById("failed").style.display = "";
                document.getElementById("err").innerHTML = j.err.message || j.err.code || j.err;
            }
        }
    } else {
        document.getElementById("progDiv").style.display = "none";
        document.getElementById("failed").style.display = "";
        document.getElementById("err").innerHTML = "You need a URL or image file to upload.";
    }
}