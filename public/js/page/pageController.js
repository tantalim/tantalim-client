'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $location, Global, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        console.info('Starting PageController');
        $scope.showLoadingScreen = true;
        var searchPath = '/search';
        var _searchMode = $location.path() === searchPath;
        console.log('path', $location.path());
        $scope.searchMode = function(newValue) {
            if (newValue) {
                newValue = (newValue);
                _searchMode = newValue;
                if (_searchMode) {
                    $location.path(searchPath);
                } else {
                    $location.path('/');
                }
            }
            console.log('searchMode', _searchMode);
            return _searchMode;
        };
        if (PageDefinition.error) {
            console.error('Error retrieving PageDefinition: ', PageDefinition.error);
            $scope.serverStatus = '';
            $scope.serverError = PageDefinition.error;
            if (PageDefinition.message) {
                $scope.serverError += ': ' + PageDefinition.message;
            }
            return;
        }
        if (!PageDefinition.page.model) {
            $scope.serverError = PageDefinition.page.name + ' page does not have a model defined.';
            return;
        }

        $scope.mode = function(newMode) {
            if (newMode) {
                $location.search('mode', newMode);
            }
            var oldMode = $location.search().mode;
            if (!oldMode)
                return '';
        };

        var pageParams = {
                filter: function (newFilter) {
                    if (newFilter) {
                        $location.search('f', newFilter);
                    }
                    return $location.search().f;
                },
                page: function (newPage) {
                    if (newPage) {
                        $location.search('p', newPage);
                    }
                    return $location.search().p;
                }
        };

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

            console.log('Searching', $location.search());
            PageService.readModelData(PageDefinition.page.model.name, pageParams.filter(), pageParams.page())
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
                    $scope.filterString = pageParams.filter();
                    $scope.pageNumber = pageParams.page();
                    ModelCursor.setRoot(PageDefinition.page.model, d.data);
                    attachModelCursorToScope();
                    $scope.showLoadingScreen = false;
                    _searchMode = false;
                });
            // TODO Don't reinitialize unless needed
        }

        function isDataLoaded() {
            if (!$scope.current) {
                return false;
            }
            if ($scope.filterString !== pageParams.filter()) {
                return false;
            }
            if ($scope.pageNumber !== pageParams.page()) {
                return false;
            }
            return true;
        }

        if (!_searchMode && isDataLoaded()) {
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
            PageCursor.toConsole();
        });


        (function initializeSearchPage() {
            $scope.filterValues = {};
            $scope.filterComparators = {};

            _.forEach(PageDefinition.page.model.fields, function (field) {
                $scope.filterComparators[field.name] = 'Contains';
            });

            $scope.runSearch = function () {
                if ($scope.filterString) {
                    pageParams.filter($scope.filterString);
                } else {
                    $location.search({});
                }
                $location.path('/');
                loadData();
            };
            $scope.cancel = function () {
                $location.path('/');
            };

            $scope.$watch('filterValues', function (newVal) {
                setFilterString(newVal, $scope.filterComparators);
            }, true);

            $scope.$watch('filterComparators', function (newVal) {
                setFilterString($scope.filterValues, newVal);
            }, true);

            var setFilterString = function (filterValues, filterComparators) {
                var filterString = '';

                _.forEach($scope.filterValues, function (value, fieldName) {
                    if (value) {
                        if (filterString.length > 0) {
                            filterString += ' AND ';
                        }
                        filterString += fieldName + ' ' + filterComparators[fieldName] + ' ' + value;
                    }
                });

                $scope.filterString = filterString;
            };

            $scope.filterString = '';
        })();
    });
