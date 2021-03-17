load();

function load() {
    document.getElementById("reqScript").style.display = "";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/browse");
    xhr.send();
    xhr.onload = function () {
        var j = JSON.parse(xhr.responseText);
        for (var c in j) {
            var a = document.createElement("A");
            a.href = "/view/" + j[c];
            var i = document.createElement("IMG");
            i.src = "/thumb/" + j[c];
            i.onerror = function() {this.src = "/404.png";}
            a.appendChild(i);
            document.getElementById("container").appendChild(a);
        }
        document.getElementById("loader").style.display = "none";
        document.getElementById("container").style.display = "";
    }
}