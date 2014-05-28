'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname);

exports.mobileIndex = function (req, res) {
    return res.sendfile(rootPath + '/pages/mobile/index.html');
};

exports.mobileList = function (req, res) {
    return res.sendfile(rootPath + '/pages/mobile/list.html');
};

exports.pageDefinition = function (req, res) {
    return res.sendfile(rootPath + '/pages/page_definition.js');
};

exports.data = function (req, res) {
    return res.sendfile(rootPath + '/pages/data.js');
};
