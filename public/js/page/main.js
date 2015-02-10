'use strict';

angular.module('tantalim.desktop')
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    })
;
