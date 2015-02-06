'use strict';

angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        return {
            readModelData: function (modelName, filterString, pageNumber) {
                var url = '/data/' + modelName + '?';
                if (filterString) {
                    url += 'filterString=' + filterString;
                }
                if (pageNumber) {
                    if (filterString) {
                        url += '&';
                    }
                    url += 'pageNumber=' + pageNumber;
                }
                return $http.get(url);
            }
        };
    });
