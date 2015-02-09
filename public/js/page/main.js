'use strict';
/* global pageName */
/**
 * Including `pageName` here from the global namespace. Tried to inject PageDefinition here but for some reason it didn't work.
 */

angular.module('tantalim.desktop')
    //.config(function ($routeProvider) {
    //    $routeProvider.
    //        when('/', {
    //            templateUrl: '/page/' + pageName + '/html'
    //        }).
    //        when('/f/:filterString', {
    //            templateUrl: '/page/' + pageName + '/html'
    //        }).
    //        when('/f/:filterString/p/:pageNumber', {
    //            templateUrl: '/page/' + pageName + '/html'
    //        }).
    //        when('/p/:pageNumber', {
    //            templateUrl: '/page/' + pageName + '/html'
    //        }).
    //        when('/search', {
    //            templateUrl: '/page/' + pageName + '/html'
    //        }).
    //        otherwise({
    //            redirectTo: '/'
    //        });
    //})
    .config(function ($locationProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
    })
;
