'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $routeParams, $location, Global, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        $scope.showLoadingScreen = true;
        $scope.searchMode = false;
        if (PageDefinition.error) {
            console.error('Error retrieving PageDefinition: ', PageDefinition.error);
            $scope.serverStatus = '';
            $scope.serverError = PageDefinition.error;
            if (PageDefinition.message) {
                $scope.serverError += ': ' + PageDefinition.message;
            }
            return;
        }

        function attachModelCursorToScope() {
            $scope.ModelCursor = ModelCursor;
            $scope.current = ModelCursor.current;
            $scope.action = ModelCursor.action;
            keyboardManager.bind('up', function () {
                if ($scope.currentModel) {
                    $scope.action.previous($scope.currentModel);
                }
            });
            keyboardManager.bind('down', function () {
                if ($scope.currentModel) {
                    $scope.action.next($scope.currentModel);
                }
            });
            keyboardManager.bind('ctrl+d', function () {
                if ($scope.currentModel) {
                    $scope.action.delete($scope.currentModel);
                }
            });
            keyboardManager.bind('ctrl+n', function () {
                if ($scope.currentModel) {
                    $scope.action.insert($scope.currentModel);
                }
            });
        }

        function loadData() {
            $scope.serverStatus = 'Loading data...';
            $scope.serverError = '';
            $scope.current = {};

            console.log('Searching', $routeParams);
            PageService.readModelData(PageDefinition.page.model.name, $routeParams.filterString, $routeParams.pageNumber)
                .then(function (d) {
                    $scope.serverStatus = '';
                    if (d.status !== 200) {
                        $scope.serverError = 'Failed to reach server. Try refreshing.';
                        return;
                    }
                    if (d.data.error) {
                        $scope.serverError = 'Error reading data from server: ' + d.data.error;
                        return;
                    }
                    $scope.filterString = $routeParams.filterString;
                    $scope.pageNumber = $routeParams.pageNumber;
                    ModelCursor.setRoot(PageDefinition.page.model, d.data);
                    attachModelCursorToScope();
                    $scope.showLoadingScreen = false;
                    $scope.searchMode = false;
                });
            // TODO Don't reinitialize unless needed
        }

        function isDataLoaded() {
            if (!$scope.current) {
                return false;
            }
            if ($scope.filterString !== $routeParams.filterString) {
                return false;
            }
            if ($scope.pageNumber !== $routeParams.pageNumber) {
                return false;
            }
            return true;
        }

        if (isDataLoaded()) {
            attachModelCursorToScope();
        } else {
            loadData();
        }

        if (!PageCursor.initialized) {
            PageCursor.initialize(PageDefinition.page);
        }

        $scope.PageCursor = PageCursor;
        $scope.staticContent = PageDefinition.staticContent;
        $scope.currentModel = PageDefinition.currentModel;
        Global.modelName = $scope.currentModel;

        $scope.rowChanged = function (thisInstance) {
            ModelCursor.change(thisInstance);
        };

        $scope.refresh = function () {
            if (ModelCursor.dirty && !$scope.serverStatus) {
                $scope.serverStatus = 'There are unsaved changes. Click [Refresh] again to discard those changes.';
                return;
            }
            loadData();
        };

        $scope.save = function () {
            $scope.serverStatus = 'Saving...';
            ModelSaver.save(PageDefinition.page.model, ModelCursor.root, function (status) {
                $scope.serverStatus = status;
                if (!status) {
                    ModelCursor.dirty = false;
                }
            });
        };
        keyboardManager.bind('ctrl+s', function () {
            $scope.save();
        });
        keyboardManager.bind('ctrl+shift+d', function () {
            console.log('DEBUGGING');
            ModelCursor.toConsole();
        });


        (function initializeSearchPage() {
            $scope.values = {};
            $scope.comparators = {};

            _.forEach(PageDefinition.page.model.fields, function (field) {
                $scope.comparators[field.name] = 'Contains';
            });

            console.log('comparators = ', $scope.comparators);

            $scope.submit = function () {
                if ($scope.filterString) {
                    $location.path('/f/' + $scope.filterString);
                } else {
                    $location.path('/');
                }
                loadData();
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
                        filterString += fieldName + ' ' + comparators[fieldName] + ' ' + value;
                    }
                });

                $scope.filterString = filterString;
            };

            $scope.filterString = '';
        })();
    });
