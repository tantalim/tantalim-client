'use strict';

angular.module('tantalim.desktop')
    .controller('SearchController', ['$scope', '$location', 'ModelData',
        function ($scope, $location, ModelData) {
            $scope.values = {};
            $scope.comparators = {};

            _.forEach(ModelData.model.fields, function(field) {
                $scope.comparators[field.fieldName] = 'Contains';
            });

            $scope.submit = function () {
                $location.path('/f/' + $scope.filterString);
            };
            $scope.cancel = function () {
                $location.path('/');
            };

            $scope.$watch('values', function (newVal) {
                setFilterString(newVal, $scope.comparators);
            }, true);

            $scope.$watch('comparators', function (newVal) {
                setFilterString($scope.values, newVal);
            }, true);

            var setFilterString = function (values, comparators) {
                var filterString = '';

                _.forEach($scope.values, function (value, fieldName) {
                    if (value) {
                        if (filterString.length > 0) {
                            filterString += ' AND ';
                        }
                        filterString += fieldName + ' ' + $scope.comparators[fieldName] + ' ' + value;
                    }
                });

                $scope.filterString = filterString;
            }

            $scope.filterString = '';
        }])
;
