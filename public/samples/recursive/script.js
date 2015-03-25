'use strict';
(function(angular, _) {
    angular.module('myApp', [])
        .controller('ExampleController', ['$scope',
            function($scope) {

                var pageModel = {
                };

                var SmartNodeInstance = function (model, row, nodeSet) {
                    return {
                        model: model,
                        data: row,
                        nodeSet: nodeSet
                    };
                };

                var SmartNodeSet = function (model, data, parentInstance) {
                    var setSelf = {
                        rows: data,
                        add: function(data) {
                            if (data.children === undefined) {
                                data.children = [];
                            }
                            data.children.push({
                                name: data.name + '.' + (data.children.length + 1)
                            });
                        },
                        remove: function(data) {
                            data.children.pop();
                        }
                    };

                    return setSelf;
                };

                $scope.select = function(row) {
                    resetCurrents(row);
                };

                $scope.current = {
                    sets: {},
                    instances: {}
                };

                function resetCurrents(row) {

                }

                $scope.root = new SmartNodeSet();

                $scope.section = 1;

            }
        ]);
})(window.angular, window._);