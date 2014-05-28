'use strict';

angular.module('tantalim.mobile')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/m/' + pageName + '/list',
                controller: 'PageController'
            }).
            when('/detail/:subPage/:id', {
                templateUrl: '/m/' + pageName + '/detail',
                controller: 'PageController'
            }).
            when('/list/:subPage', {
                templateUrl: '/m/' + pageName + '/list',
                controller: 'PageController'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
;
