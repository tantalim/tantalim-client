'use strict';

angular.module('tantalim.mobile')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/m/' + pageName + '/list'
            }).
            when('/detail/:subPage/:id', {
                templateUrl: '/m/' + pageName + '/list'
            }).
            when('/list/:subPage', {
                templateUrl: '/m/' + pageName + '/list'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
;
