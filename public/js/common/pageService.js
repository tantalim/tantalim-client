'use strict';
/* global angular */

angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        var self = {
            readModelData: function (modelName, filterString, pageNumber) {
                var url = '/data/' + modelName + '?';
                if (filterString) {
                    url += 'filter=' + filterString;
                }
                if (pageNumber) {
                    if (filterString) {
                        url += '&';
                    }
                    url += 'page=' + pageNumber;
                }
                return self.readUrl(url);
            },
            readUrl: function (url) {
                return $http.get(url);
            }
        };
        return self;
    });
