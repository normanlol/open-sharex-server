checkforDK();

function checkforDK() {
    var id = window.location.pathname.split("/view/")[1].split("/")[0];
    if (!localStorage.getItem("dk-mini-db")) {return;}
    var j = JSON.parse(localStorage.getItem("dk-mini-db"));
    for (var c in j) {
        if (j[c].id == id) {
            showDeleteButton(j[c].dk);
            return;
        } else {
            continue;
        }
    }
    document.getElementById("delete").style.display = "none";
}

function showDeleteButton(dk) {
    if (!dk) {return;}
    document.getElementById("delBtn").setAttribute("data-dk", dk);
    document.getElementById("delBtn").onclick = function () {
        del(this.getAttribute("data-dk"), this);
    }
    document.getElementById("delFallback").style.display = "none";
    document.getElementById("delete").style.display = "";
}

function del(dk, t) {
    var xhr = new XMLHttpRequest();
    if (t && t.innerHTML) {t.innerHTML = "Deleting...";}
    xhr.open("GET", "/delete/" + dk);
    xhr.send();
    xhr.onload = function () {
        var j = JSON.parse(xhr.responseText);
        if (j.success) {
            if (t && t.innerHTML) {t.innerHTML = "Deleted successfully.";}
        } else {
            if (t && t.innerHTML) {t.innerHTML = "Error deleting. Probably already has been deleted.";}
        }
        setTimeout(function() {
            if (t.remove) {t.remove();}
        }, 5000);
    }
}