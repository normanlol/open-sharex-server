const fs = require("fs");
const http = require("http");
const formidable = require("formidable");
const cheerio = require("cheerio");
const url = require("url");
const port = process.env.PORT || 2000

if (!fs.existsSync(__dirname + "/config.json")) {
    fs.copyFileSync(__dirname + "/config.example.json", __dirname + "/config.json");
}

const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

http.createServer(requestListener).listen(port);
console.log("-- open on port " + port + " --");

function requestListener(request, response) {
    var u = url.parse(request.url, true);
    var path = u.pathname.split("/").slice(1);
    switch(path[0]) {
        case "upload":
            if (request.method.toLowerCase() == "post") {
                var f = formidable();
                f.parse(request, function(err, fields, files) {
                    if (err) {
                        handleError(err, request, response)
                    } else {
                        if (files.file) {
                            if (files.file.size > config.maxSize) {
                                response.writeHead(403, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(JSON.stringify({
                                    "success": false,
                                    "err": {
                                        "code": "tooLarge",
                                        "message": "The file you attempted to upload was too big!"
                                    }
                                }));
                            } else {
                                if (files.file.type == "image/png") { var t = "png"; }
                                else if (files.file.type == "image/jpg") { var t = "jpg"; }
                                else if (files.file.type == "image/jpeg") { var t = "jpeg"; }
                                else if (files.file.type == "image/gif") { var t = "gif"; }
                                else {
                                    response.writeHead(403, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type": "application/json"
                                    });
                                    response.end(JSON.stringify({
                                        "success": false,
                                        "err": {
                                            "code": "notSupported",
                                            "message": "The file you attempted to upload is not supported!"
                                        }
                                    }));
                                    return;
                                }
                                if (config.requireAuth == true) {  
                                    if (request.headers["authentication"]) {
                                        if (!validAuth(request.headers["authentication"])) {
                                            response.writeHead(403, {
                                                "Access-Control-Allow-Origin": "*",
                                                "Content-Type": "application/json"
                                            });
                                            response.end(JSON.stringify({
                                                "success": false,
                                                "err": {
                                                    "code": "needAuth",
                                                    "message": "You must have a valid authentication token."
                                                }
                                            }));
                                            return;
                                        }
                                    } else {
                                        response.writeHead(403, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "application/json"
                                        });
                                        response.end(JSON.stringify({
                                            "success": false,
                                            "err": {
                                                "code": "needAuth",
                                                "message": "You must have an authentication token."
                                            }
                                        }));
                                        return;
                                    }
                                }
                                var id = createId();
                                var dk = deleteKey(id);
                                var fn = __dirname + "/files/" + id + "." + t;
                                var mdfn = __dirname + "/files/meta/" + id + ".json";
                                if (!fs.existsSync(__dirname + "/files/")) {fs.mkdirSync(__dirname + "/files/")}
                                if (!fs.existsSync(__dirname + "/files/meta/")) {fs.mkdirSync(__dirname + "/files/meta/")}
                                fs.writeFileSync(fn, fs.readFileSync(files.file.path));
                                if (request.headers["authentication"]) {
                                    var md = JSON.stringify({
                                        "uploader": whoIs(request.headers["authentication"]),
                                        "uploaderKey": request.headers["authentication"],
                                        "uploadedAt": new Date() * 1,
                                        "deleteKey": dk
                                    });
                                } else {
                                    var md = JSON.stringify({
                                        "uploader": "Anonymous",
                                        "uploaderKey": null,
                                        "uploadedAt": new Date() * 1,
                                        "deleteKey": dk
                                    });
                                }
                                fs.writeFileSync(mdfn, md);
                                var res = JSON.stringify({
                                    "success": true,
                                    "id": id,
                                    "deleteKey": dk
                                });
                                response.writeHead(201, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "application/json"
                                });
                                response.end(res);
                            }
                        } else {
                            response.writeHead(400, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "application/json"
                            });
                            response.end(JSON.stringify({
                                "success": false,
                                "err": {
                                    "code": "invalidFormat",
                                    "message": "This endpoint needs to have the files under the 'file' parameter."
                                }
                            }));
                        }
                    }
                });
            } else {
                response.writeHead(403, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify({
                    "success": false,
                    "err": {
                        "code": "invalidMethod",
                        "message": "This endpoint only accepts POST requests."
                    }
                }));
            }
        return;

        case "u":
            fs.readFile(__dirname + "/frontend/dynamic/u/index.html", function(err, resp) {
                if (err) {
                    handleError(err, request, response);
                } else {
                    var $ = cheerio.load(resp);
                    if (config.requireAuth == false) {$(".authCode").remove();}
                    $(".name").text(config.serverName);
                    response.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/html"
                    });
                    response.end($.html());
                }
            })
        return;

        case "delete":
            if (whatDk(path[1]) !== null) {
                var t = "." + whatType(whatDk(path[1]));
                if (fs.existsSync(__dirname + "/files/" + whatDk(path[1]) + t)) {
                    fs.unlinkSync(__dirname + "/files/" + whatDk(path[1]) + t);
                    fs.unlinkSync(__dirname + "/files/meta/" + whatDk(path[1]) + ".json");
                    response.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    });
                    var res = JSON.stringify({
                        "success": true
                    });
                    response.end(res)
                } else {
                    response.writeHead(400, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    });
                    response.end(JSON.stringify({
                        "success": false,
                        "err": {
                            "code": "alreadyDeleted",
                            "message": "This photo has already been deleted."
                        }
                    }));
                }
            } else {
                response.writeHead(400, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify({
                    "success": false,
                    "err": {
                        "code": "invalidDeleteKey",
                        "message": "Could not find your delete key."
                    }
                }));
            }
        return;

        case "view":
            if (whatType(path[1]) !== null) {
                fs.readFile(__dirname + "/frontend/dynamic/view/index.html", function(err, resp) {
                    if (err) {
                        handleError(err, request, response);
                    } else {
                        var $ = cheerio.load(resp);
                        var j = JSON.parse(fs.readFileSync(__dirname + "/files/meta/" + path[1] + ".json"));
                        if (j.uploader == null) {$("#upContainer").remove();} else {$("#uploader").text(j.uploader)}
                        if (j.uploadedAt == null) {$("#dateContainer").remove();} else {$("#date").text(new Date(j.uploadedAt).toString());}
                        $(".name").text(config.serverName);
                        $("img").attr("src", "/" + path[1]);
                        response.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "text/html"
                        });
                        response.end($.html());
                    }
                })
            } else {
                handleError("404", request, response);
            }
        return;

        case "gen":
            if (path[1] == "sharex") {
                if (request.method.toLowerCase() == "get") {
                    var json = JSON.stringify({
                        "Version": "13.4.0",
                        "DestinationType": "ImageUploader",
                        "RequestMethod": "POST",
                        "RequestURL": config.host + "/upload",
                        "Body": "MultipartFormData",
                        "FileFormName": "file",
                        "URL": config.host + "/$json:id$",
                        "DeletionURL": config.host + "/delete/$json:deleteKey$"
                    });
                    response.writeHead(201, {
                        "Access-Control-Allow-Origin":"*",
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": "attachment; filename=sharex.sxcu"
                    });
                    response.end(json);
                } else {
                    var f = formidable();
                    f.parse(request, function(err, fields) {
                        if (fields.auth) {
                            var json = JSON.stringify({
                                "Version": "13.4.0",
                                "DestinationType": "ImageUploader",
                                "RequestMethod": "POST",
                                "RequestURL": config.host + "/upload",
                                "Headers": {
                                    "authentication": fields.auth
                                },
                                "Body": "MultipartFormData",
                                "FileFormName": "file",
                                "URL": config.host + "/$json:id$",
                                "DeletionURL": config.host + "/delete/$json:deleteKey$"
                            });
                            response.writeHead(201, {
                                "Access-Control-Allow-Origin":"*",
                                "Content-Type": "application/octet-stream",
                                "Content-Disposition": "attachment; filename=sharex.sxcu"
                            });
                            response.end(json);
                        } else if (err) {
                            handleError(err, request, response);
                        } else {
                            response.writeHead(302, {
                                "Location": "/gen/auth"
                            });
                            response.end();
                        }
                    });
                }
            } else if (path[1] == "auth") {
                if (config.requireAuth == true) {
                    if (request.method.toLowerCase() == "post") {
                        var f = formidable();
                        f.parse(request, function(err, fields) {
                            if (err) {
                                handleError(err, request, response);
                            } else {
                                if (fields.password && fields.simpleName) {
                                    if (fields.password == config.authGenPass && !nameTaken(fields.simpleName)) {
                                        fs.readFile(__dirname + "/frontend/dynamic/authGen/success.html", function(err, resp) {
                                            if (err) {
                                                handleError(err, request, response);
                                            } else {
                                                var $ = cheerio.load(resp);
                                                var a = getAuth(fields.simpleName);
                                                $(".name").text(config.serverName);
                                                $(".code").attr("value", a);
                                                $("#key").attr("value", a);
                                                response.writeHead(201, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "text/html"
                                                });
                                                response.end($.html());
                                            }
                                        });
                                    } else if (fields.password !== config.authGenPass) {
                                        fs.readFile(__dirname + "/frontend/dynamic/authGen/err.html", function(err, resp) {
                                            if (err) {
                                                handleError(err, request, response);
                                            } else {
                                                var $ = cheerio.load(resp);
                                                $("i").text("Invalid password.");
                                                $(".name").text(config.serverName);
                                                response.writeHead(400, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "text/html"
                                                });
                                                response.end($.html());
                                            }
                                        });
                                    } else {
                                        fs.readFile(__dirname + "/frontend/dynamic/authGen/err.html", function(err, resp) {
                                            if (err) {
                                                handleError(err, request, response);
                                            } else {
                                                var $ = cheerio.load(resp);
                                                $("i").text("That name is already taken.");
                                                $(".name").text(config.serverName);
                                                response.writeHead(400, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type": "text/html"
                                                });
                                                response.end($.html());
                                            }
                                        });
                                    }
                                } else {
                                    fs.readFile(__dirname + "/frontend/dynamic/authGen/err.html", function(err, resp) {
                                        if (err) {
                                            handleError(err, request, response);
                                        } else {
                                            var $ = cheerio.load(resp);
                                            $("i").text("Both fields are required.");
                                            $(".name").text(config.serverName);
                                            response.writeHead(400, {
                                                "Access-Control-Allow-Origin": "*",
                                                "Content-Type": "text/html"
                                            });
                                            response.end($.html());
                                        }
                                    });
                                }
                            }
                        })
                    } else {
                        fs.readFile(__dirname + "/frontend/dynamic/authGen/index.html", function(err, resp) {
                            if (err) {
                                handleError(err, request, response);
                            } else {
                                var $ = cheerio.load(resp);
                                $(".name").text(config.serverName);
                                response.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type": "text/html"
                                });
                                response.end($.html());
                            }
                        })
                    }
                }
            } else {
                response.writeHead(302, {
                    "Location": "/"
                });
                response.end();
            }
        return;

        default:
            if (fs.existsSync(__dirname + "/frontend/static" + u.pathname + "index.html")) {
                fs.readFile(__dirname + "/frontend/static" + u.pathname + "index.html", function(err, resp) {
                    if (err) {
                        handleError(err, request, response);
                    } else {
                        var $ = cheerio.load(resp);
                        $(".name").text(config.serverName);
                        response.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "text/html"
                        });
                        response.end($.html());
                    }
                });
            } else if (fs.existsSync(__dirname + "/frontend/static" + u.pathname)) {
                fs.readFile(__dirname + "/frontend/static" + u.pathname, function(err, resp) {
                    if (err) {
                        handleError(err, request, response);
                    } else {
                        response.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": getMime(u.pathname)
                        });
                        response.end(resp);
                    }
                })
            } else if (
                whatType(u.pathname.substring(1)) !== null
            ) {
                fs.readFile(__dirname + "/files" + u.pathname + "." + whatType(u.pathname.substring(1)), function(err, resp) {
                    if (err) {
                        handleError(err, request, response);
                    } else {
                        response.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "image/" + whatType(u.pathname.substring(1))
                        });
                        response.end(resp);
                    }
                })
            } else {
                handleError("404", request, response);
            }
        return;
    }
}

function createId() {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    for (var c = 0; c < 10; c++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function whatType(id) {
    if (!fs.existsSync(__dirname + "/files/")) { return null; } else {
        for (var c in fs.readdirSync(__dirname + "/files/")) {
            if (fs.readdirSync(__dirname + "/files/")[c] == "meta") { continue; }
            else if (fs.readdirSync(__dirname + "/files/")[c].split(".")[0] == id) { return fs.readdirSync(__dirname + "/files/")[c].split(".")[1]; }
            else { continue; }
        }
        return null;
    }
}

function getAuth(n) {
    var k = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var c = 0; c < 65; c++) {
        k += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!fs.existsSync(__dirname + "/keys/")) { fs.mkdirSync(__dirname + "/keys/"); }
    if (fs.existsSync(__dirname + "/keys/db.json")) {
        var c = JSON.parse(fs.readFileSync(__dirname + "/keys/db.json"));
        c.push({
            "key": k,
            "name": n
        });
        fs.writeFileSync(__dirname + "/keys/db.json", JSON.stringify(c));
        return k;
    } else {
        var c = [
            {
                "key": k,
                "name": n
            }
        ];
        fs.writeFileSync(__dirname + "/keys/db.json", JSON.stringify(c));
        return k;
    }
}

function deleteKey(id) {
    var result = "";
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var c = 0; c < 20; c++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (fs.existsSync(__dirname + "/keys/delete-db.json")) {
        var c = JSON.parse(fs.readFileSync(__dirname + "/keys/delete-db.json"));
        c.push({
            "key": result,
            "id": id
        });
        fs.writeFileSync(__dirname + "/keys/delete-db.json", JSON.stringify(c));
        return result;
    } else {
        var c = [
            {
                "key": result,
                "id": id
            }
        ];
        fs.writeFileSync(__dirname + "/keys/delete-db.json", JSON.stringify(c));
        return result;
    }
}

function validAuth(a) {
    if (a.length !== 65) {
        return false;
    } else {
        if (!fs.existsSync(__dirname + "/keys/db.json")) { return false; } else {
            var j = JSON.parse(fs.readFileSync(__dirname + "/keys/db.json"));
            for (var c in j) {
                if (j[c].key == a) {return true;} else {continue;}
            }
            return false;
        }
    }
}

function whatDk(a) {
    if (a.length !== 20) {
        return false;
    } else {
        if (!fs.existsSync(__dirname + "/keys/delete-db.json")) { return null; } else {
            var j = JSON.parse(fs.readFileSync(__dirname + "/keys/delete-db.json"));
            for (var c in j) {
                if (j[c].key == a) {return j[c].id;} else {continue;}
            }
            return null;
        }
    }
}

function whoIs(a) {
    if (a.length !== 65) {
        return null;
    } else {
        if (!fs.existsSync(__dirname + "/keys/db.json")) { return null; } else {
            var j = JSON.parse(fs.readFileSync(__dirname + "/keys/db.json"));
            for (var c in j) {
                if (j[c].key == a) {return j[c].name;} else {continue;}
            }
            return null;
        }
    }
}

function nameTaken(a) {
    a = a.toLowerCase();
    if (!fs.existsSync(__dirname + "/keys/db.json")) { return false; } else {
        var j = JSON.parse(fs.readFileSync(__dirname + "/keys/db.json"));
        for (var c in j) {
            if (j[c].name.toLowerCase() == a) {return true;} else {continue;}
        }
        return false;
    }
}

function getMime(file) {
    var ft = file.split(".")[file.split(".").length - 1];
    switch (ft) {
        case "html": 
            return "text/html";
        case "css": 
            return "text/css";
        case "js":
            return "application/javascript";
        case "json":
            return "application/json";
        case "png":
            return "image/png";
        case "jpg":
            return "image/jpg";
        case "jpeg":
            return "image/jpeg";
        case "gif":
            return "image/gif";
        default:
            return "text/plain";
    }
}

function handleError(error, request, response) {
    if (error == "404" || error.code == "ENOENT" || error.code == "EISDIR") {
        if (request.headers.accept && request.headers.accept.startsWith("image/")) {
            fs.readFile(__dirname + "/frontend/dynamic/error/404.png", function(err, resp) {
                if (err) {
                    response.writeHead(500, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/plain"
                    });
                    var s = error.stack || error.message || error.code || error;
                    response.end(s);
                } else {
                    response.writeHead(404, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "image/png"
                    });
                    response.end(resp);
                }
            });
        } else {
            fs.readFile(__dirname + "/frontend/dynamic/error/404.html", function(err, resp) {
                if (err) {
                    response.writeHead(500, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "text/plain"
                    });
                    var s = error.stack || error.message || error.code || error;
                    response.end(s);
                } else {
                    var $ = cheerio.load(resp);
                    $(".name").text(config.serverName);
                    response.writeHead(404, {
                        "Access-Control-Allow-Origin" : "*",
                        "Content-Type": "text/html"
                    });
                    response.end($.html());
                }
            });
        }
    } else {
        fs.readFile(__dirname + "/frontend/dynamic/error/generic.html", function(err, resp) {
            if (err) {
                response.writeHead(500, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/plain"
                });
                var s = err.stack || err.message || err.code || err;
                response.end(s);
            } else {
                var $ = cheerio.load(resp);
                $("#err").text(error.stack || error.message || error.code || err);
                $(".name").text(config.serverName);
                response.writeHead(404, {
                    "Access-Control-Allow-Origin" : "*",
                    "Content-Type": "text/html"
                });
                response.end($.html());
            }
        });
    }
}