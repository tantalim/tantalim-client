'use strict';

/**
 * mock server to display html files and server side json for testing client code
 */

var path = require('path');
var rootPath = path.normalize(__dirname);

var express = require('express');

var config;

var app = express();

// Enable jsonp
app.enable('jsonp callback');

function mobile(res, file) {
    return res.sendfile(rootPath + '/pages/mobile/' + file + '.html');
};

function addRoutes() {
    app.get('/', function (req, res) {
        res.redirect('m/Home');
    });

    app.get('/m/:pageName/list', function (req, res) {
        mobile(res, 'list');
    });

    app.get('/m/:pageName/detail', function (req, res) {
        mobile(res, 'detail');
    });

    app.get('/m/:pageName/nav', function (req, res) {
        mobile(res, 'nav');
    });

    app.get('/mobile-menu', function (req, res) {
        mobile(res, 'sidebar');
    });

    app.get('/m/:pageName', function (req, res) {
        mobile(res, 'index');
    });

    app.get('/page-definition/:pageName', function (req, res) {
        res.sendfile(rootPath + '/pages/page_definition.js');
    });

    app.get('/data/:pageName', function (req, res) {
        res.sendfile(rootPath + '/pages/data.js');
    });
}

app.configure(function () {
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());
    app.use(app.router);
    addRoutes();
    app.use(express.static(rootPath + '/../public'));
});

var server = app.listen(3001, function () {
    console.log('Tantalim Mock Server running on port:%d', server.address().port);
});
