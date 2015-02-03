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
                templateUrl: '/page/' + pageName + '/search'
            }).
            when('/search/:filterString', {
                templateUrl: '/page/' + pageName + '/search'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
    .controller('HeaderController', ['$scope', 'Global', 'PageService',
        function ($scope, Global, service) {
            $scope.global = Global;
            service.getMenu().then(function (d) {
                $scope.menu = d.data;
            });
        }])
;
