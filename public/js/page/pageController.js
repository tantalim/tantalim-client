'use strict';
/* global _ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager, $window) {
        $scope.showLoadingScreen = true;

        var topModel = PageDefinition.page.sections[0].model;

        function SearchController() {
            var searchPath = '/search';
            var self = {
                showSearch: undefined,
                initialize: function () {
                    self.showSearch = $location.path() === searchPath;
                },
                turnSearchOn: function () {
                    $location.path(searchPath);
                    self.showSearch = true;
                },
                turnSearchOff: function () {
                    $location.path('/');
                    self.showSearch = false;
                },
                filter: function (newFilter) {
                    if (newFilter) {
                        $location.search('filter', newFilter);
                    }
                    return $location.search().filter;
                },
                maxPages: 99, // TODO get the max from server
                page: function (newPage) {
                    if (newPage) {
                        $location.search('page', newPage);
                    }
                    return parseInt($location.search().page || 1);
                },
                previousPage: function () {
                    var currentPage = self.page();
                    if (currentPage > 1) {
                        self.page(currentPage - 1);
                    }
                },
                nextPage: function () {
                    var currentPage = self.page();
                    if (currentPage < self.maxPages) {
                        self.page(currentPage + 1);
                    }
                }
            };
            return self;
        }

        var searchController = new SearchController();
        $scope.searchController = searchController;

        function loadData() {
            $log.info('loadData()');
            $scope.serverStatus = 'Loading data...';
            $scope.serverError = '';

            PageService.readModelData(topModel.name, searchController.filter(), searchController.page())
                .then(function (d) {
                    $scope.serverStatus = '';
                    if (d.status !== 200) {
                        $scope.serverError = 'Failed to reach server. Try refreshing.';
                        return;
                    }
                    if (d.data.error) {
                        $scope.serverError = 'Error reading data from server: ' + d.data.error.message;
                        return;
                    }
                    $scope.filterString = searchController.filter();
                    $scope.pageNumber = searchController.page();
                    searchController.maxPages = d.data.maxPages;
                    ModelCursor.setRoot(topModel, d.data.rows);

                    $scope.ModelCursor = ModelCursor;
                    $scope.current = ModelCursor.current;
                    $scope.action = ModelCursor.action;
                    searchController.turnSearchOff();
                    $scope.showLoadingScreen = false;
                });
        }

        PageCursor.initialize(PageDefinition.page);
        $scope.PageCursor = PageCursor;

        $scope.focusSet = function (currentSet) {
            $scope.currentSet = currentSet;
        };

        // Only support a single page section at the top
        //$scope.focusSet(PageDefinition.page.sections[0].model.name);

        (function setupHotKeys() {
            keyboardManager.bind('up', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.movePrevious();
                }
            });
            keyboardManager.bind('tab', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('enter', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('down', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('ctrl+d', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.delete();
                }
            });
            keyboardManager.bind('ctrl+n', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.insert();
                }
            });

            keyboardManager.bind('ctrl+s', function () {
                $scope.save();
            });
            keyboardManager.bind('meta+s', function () {
                $scope.save();
            });
            keyboardManager.bind('meta+c', function () {
                $scope.action.copy();
            });
            keyboardManager.bind('meta+v', function () {
                $scope.action.paste();
            });
            keyboardManager.bind('ctrl+shift+d', function () {
                console.log('DEBUGGING');
                ModelCursor.toConsole();
                PageCursor.toConsole();
            });

        })();

        (function addFormMethodsToScope() {
            $scope.refresh = function () {
                $log.debug('refresh()');
                if (ModelCursor.dirty() && !$scope.serverStatus) {
                    $scope.serverStatus = 'There are unsaved changes. Click [Refresh] again to discard those changes.';
                    return;
                }
                loadData();
            };

            $scope.save = function () {
                $scope.serverStatus = 'Saving...';
                ModelSaver.save(topModel, ModelCursor.root, function (error) {
                    $scope.serverStatus = '';
                    $scope.serverError = error;
                });
            };
        })();

        (function initializeSearchPage() {
            $scope.filterValues = {};
            $scope.filterComparators = {};

            angular.forEach(topModel.fields, function (field) {
                $scope.filterComparators[field.name] = 'Contains';
            });

            $scope.runSearch = function () {
                $log.debug('runSearch()');
                if ($scope.filterString) {
                    searchController.filter($scope.filterString);
                } else {
                    $location.search({});
                }
                loadData();
            };

            $scope.$watch('filterValues', function (newVal) {
                setFilterString(newVal, $scope.filterComparators);
            }, true);

            $scope.$watch('filterComparators', function (newVal) {
                setFilterString($scope.filterValues, newVal);
            }, true);

            var setFilterString = function (filterValues, filterComparators) {
                var filterString = '';

                angular.forEach($scope.filterValues, function (value, fieldName) {
                    if (value) {
                        if (filterString.length > 0) {
                            filterString += ' AND ';
                        }
                        // TODO Properly escape single/double quotes
                        filterString += fieldName + ' ' + filterComparators[fieldName] + ' "' + value + '"';
                    }
                });

                $scope.filterString = filterString;
            };

            $scope.filterString = '';
        })();

        var recursiveLevel = 0;
        $scope.recursive = function(name) {
            recursiveLevel++;
            console.info(name + '=' + recursiveLevel);
            if (recursiveLevel > 2) return null;
            else return [recursiveLevel];
        };

        $scope.getCurrentSet = ModelCursor.getCurrentSet;
        $scope.getCurrentInstance = ModelCursor.getCurrentInstance;

        $scope.link = function (targetPage, filter, modelName) {
            var data = ModelCursor.current.instances[modelName];
            _.forEach(data.data, function (value, key) {
                filter = filter.replace('[' + key + ']', data.data[key]);
            });
            $window.location.href = '/page/' + targetPage + '/?filter=' + filter;
        };

        function initializePage() {
            $log.debug('initializePage()');
            searchController.initialize();
            if (searchController.showSearch) {
                $scope.showLoadingScreen = false;
            } else {
                loadData();
            }
        }

        // $locationChangeSuccess apparently gets called automatically, so don't initialize explicitly
        // initializePage();
        $scope.$on('$locationChangeSuccess', function () {
            initializePage();
        });
    });
