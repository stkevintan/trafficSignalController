/**
 * Created by kevin on 15-6-30.
 */
var gui = require('nw.gui');
var win = gui.Window.get();
$(document).foundation();
function createDOM(name, opts, inner) {
    var dom = document.createElement(name);
    for (var key in opts) {
        dom.setAttribute(key, opts[key]);
    }
    if (typeof inner !== 'undefined') {
        dom.innerText = inner;
    }
    return dom;
}

