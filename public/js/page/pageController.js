'use strict';
/* global _ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, $window, Logger) {
        $scope.showLoadingScreen = true;
        $scope.serverStatus = Logger.getStatus();
        $scope.serverError = Logger.getError();
        $scope.Logger = Logger;

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
            Logger.info('Loading data...');
            Logger.error('');

            PageService.readModelData(topModel.name, searchController.filter(), searchController.page())
                .then(function (d) {
                    Logger.info('');
                    if (d.status !== 200) {
                        Logger.error('Failed to reach server. Try refreshing.');
                        $scope.loadingFailed = true;
                        return;
                    }
                    if (d.data.error) {
                        Logger.error('Error reading data from server: ' + d.data.error.message);
                        $scope.loadingFailed = true;
                        return;
                    }
                    $scope.filterString = searchController.filter();
                    $scope.pageNumber = searchController.page();
                    searchController.maxPages = d.data.maxPages;
                    ModelCursor.setRoot(topModel, d.data.rows);
                    PageCursor.initialize(PageDefinition.page, d.data.rows);
                    $scope.PageCursor = PageCursor;

                    // Only support a single page section at the top
                    //$scope.focusSet(PageDefinition.page.sections[0].model.name);

                    searchController.turnSearchOff();
                    $scope.showLoadingScreen = false;
                });
        }

        (function addFormMethodsToScope() {
            $scope.refresh = function () {
                $log.debug('refresh()');
                if (ModelCursor.dirty() && !Logger.getStatus()) {
                    Logger.info('There are unsaved changes. Click [Refresh] again to discard those changes.');
                    return;
                }
                loadData();
            };

            $scope.save = function () {
                Logger.info('Saving...');
                ModelSaver.save(topModel, ModelCursor.root, function (error) {
                    Logger.info('');
                    Logger.error(error);
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

        $scope.link = function (targetPage, filter, modelName) {
            var data = ModelCursor.getCurrentSet(modelName, 0).getSelectedRows();
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
