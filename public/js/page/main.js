'use strict';

angular.module('tantalim.desktop')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/f/:filterString', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/f/:filterString/p/:pageNumber', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/p/:pageNumber', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/search', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
;
