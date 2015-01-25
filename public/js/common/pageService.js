'use strict';

angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        return {
            readModelData: function (modelName) {
                return $http.get('/data/' + modelName);
            },
            queryModelData: function (modelName, query) {
                //console.info("queryModelData");
                //console.info(query);
                var url = '/data/' + modelName;
                if (angular.isArray(query)) {
                    url += "?"
                    _.forEach(query, function (clause) {
                        url += clause.field + clause.operator + clause.value + "&";
                    });
                } else if (query) {
                    url += '/q/' + query;
                }
                return $http.get(url);
            },
            getMenu: function () {
                return $http.get('/menu/');
            }
        };
    });
