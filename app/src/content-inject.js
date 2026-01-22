const utilsBrowser = require("./utils-browser");
const utils = require("./utils");
const utilsExtension = require("./extension/utils-extension");

window._G = utilsBrowser;
window._G.utils = utils;
window._G.utilsExtension = utilsExtension;