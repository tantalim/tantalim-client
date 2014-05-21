'use strict';

angular.module('tantalim.desktop')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/p/:subPage', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/search', {
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
    .controller('SearchController', ['$scope', '$location',
        function ($scope, $location) {
            var modelName = '{{model.modelName}}';
            $scope.submit = function () {
                $location.path('page/' + modelName);
            };
        }])

;
