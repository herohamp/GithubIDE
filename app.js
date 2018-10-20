function makeFile(path, content) {
    let paths = path.split("/");
    let name = paths.pop();
    paths.shift();

    var vdirPath = app.vdir;

    var currentPath = "/";
    for (var i in paths) {
        currentPath += paths[i] + "/";
        if (vdirPath[paths[i]] === undefined) {
            Vue.set(vdirPath, paths[i], { type: "folder", path: currentPath })
        }

        vdirPath = vdirPath[paths[i]];
    }

    var ext = name.split(".").pop();
    var type = "text";

    switch (ext) {
        case "js":
            type = "js";
            break;
        case "html":
            type = "html";
            break;
        case "css":
            type = "css";
            break;
    }

    Vue.set(vdirPath, name, { content: content, type: type, path: path });
}

var currentFile = null;

function runCode() {

    if (currentFile === null) { return };

    switch (currentFile.type) {
        case "js":
            eval(editor.getValue());
            break;
        case "html":
            var w = window.open('', "", "scrollbars=yes");

            var content = editor.getValue();

            w.document.body.innerHTML = content;

            var scripts = w.document.querySelectorAll('script'),
                i;

            for (i = 0; i < scripts.length; ++i) {
                let src = scripts[i].getAttribute('src');
                if (src.startsWith("./") || src.startsWith("/")) {
                    if (pathToVDir(src) != undefined) {
                        scripts[i].removeAttribute('src');
                        scripts[i].innerHTML = pathToVDir(src).content;
                        let temp = document.createElement("script");
                        temp.innerHTML = pathToVDir(src).content;
                        w.document.body.appendChild(temp);
                        scripts[i].remove();
                    }
                }
            }

            var styles = w.document.querySelectorAll('link'),
                i;

            for (i = 0; i < styles.length; ++i) {
                let href = styles[i].getAttribute("href");
                if (href != null) {
                    if (href.startsWith("./") || href.startsWith("/")) {
                        if (pathToVDir(href) != undefined) {
                            styles[i].removeAttribute('href');
                            styles[i].innerHTML = pathToVDir(href).content;
                            let temp = document.createElement("style");
                            temp.innerHTML = pathToVDir(href).content;
                            w.document.body.appendChild(temp);
                            styles[i].remove();
                        }
                    }
                }

            }

            break;

    }
}

function pathToVDir(path) {
    let paths = path.split("/");
    paths.shift();

    var vdirPath = app.vdir;

    var currentPath = "/";
    for (var i in paths) {
        currentPath += paths[i] + "/";

        vdirPath = vdirPath[paths[i]];
    }

    return vdirPath;
}


Vue.component('file-listing', {
    props: ['file'],
    methods: {
        load: function(event) {
            if (currentFile != null)
                currentFile.content = editor.getValue();

            let path = pathToVDir(this._props.file.path);
            editor.setValue(path.content);
            currentFile = path;

            switch (currentFile.type) {
                case "js":
                    editor.session.setMode("ace/mode/javascript");
                    break;
                case "html":
                    editor.session.setMode("ace/mode/html");
                    break;
                case "css":
                    editor.session.setMode("ace/mode/css");
                    break;
                default:
                    editor.session.setMode("ace/mode/text");
            }
        }
    },
    template: `<div class="card"> <div class="card-header"> <a class="collapsed card-link" href="#" v-on:click="load">{{file.path}}</a> </div> </div>`
});

Vue.component('folder-listing', {
    id: "",
    props: ['file'],
    template: `<div class="card">
                <div class="card-header">
                  <a class="card-link" data-toggle="collapse" v-bind:href="'#collapese-'+this.id">
                    {{file.path}}
                  </a>
                </div>
                <div v-bind:id="'collapese-'+this.id" class="collapse">
                  <div class="card-body" style="padding: 0px !important; padding-left: 10px;">
                    <div v-for="iFile in file" id="accordion">
                        <file-listing v-bind:file="iFile" v-if="iFile.type != 'folder' && iFile.type != undefined"></file-listing>
                        <folder-listing v-bind:file="iFile" v-if="iFile.type === 'folder'"></folder-listing>
                    </div>
                  </div>
                </div>
              </div>`,
    created() {
        this.id = this._props.file.path.replace(/\//g, '');
    }

});

var app = new Vue({
    el: '#app',
    data: {
        accordion: 0,
        vdir: {

        }
    }
})

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/text");


makeFile("/js/main.js", "alert(1);");
makeFile("/css/main.css", "html, body {\n\tbackground-color:red; \n\twidth:100%\n}");
makeFile("/index.html", "<link rel='stylesheet' href='./css/main.css' type='text/css' />\n<h1>Hello :D</h1>\n<script src='/js/main.js'></script>");

document.getElementById("runCode").onclick = runCode;
document.getElementById("createFile").onclick = function() {
    var name = "";
    while (name === "" || name.charAt(0) != "/") {
        name = prompt("Path of file, Start with /");
    }
    makeFile(name, "");
}