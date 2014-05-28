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

app.configure(function () {
    // Request body parsing middleware should be above methodOverride
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());

    // Routes should be at the last
    app.use(app.router);

    var pageController = require('./pageController');

    app.get('/m/:pageName/list', function (req, res) {
        pageController.mobileList(req, res);
    });

    app.get('/m/:pageName', function (req, res) {
        pageController.mobileIndex(req, res);
    });

    app.get('/page-definition/:pageName', function (req, res) {
        pageController.pageDefinition(req, res);
    });

    app.get('/data/:pageName', function (req, res) {
        pageController.data(req, res);
    });

    app.use(express.static(rootPath + '/../public'));
});

var server = app.listen(3001, function () {
    console.log('Tantalim Mock Server running on port:%d', server.address().port);
});