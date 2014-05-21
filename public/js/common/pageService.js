'use strict';

angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        return {
            readModelData: function (modelName) {
                return $http.get('/data/' + modelName);
            },
            queryModelData: function (modelName, query) {
                return $http.get('/data/' + modelName + '/q/' + query);
            },
            getMenu: function () {
                return $http.get('/menu/');
            }
        };
    });
