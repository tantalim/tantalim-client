'use strict';
/* global _ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $location, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        $scope.showLoadingScreen = true;
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

        function SearchController() {
            var searchPath = '/search';
            var self = {
                showSearch: undefined,
                initialize: function() {
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
            return self;
        }

        var searchController = new SearchController();
        $scope.searchController = searchController;

        function loadData() {
            $scope.serverStatus = 'Loading data...';
            $scope.serverError = '';

            PageService.readModelData(PageDefinition.page.model.name, searchController.filter(), searchController.page())
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
                    $scope.filterString = searchController.filter();
                    $scope.pageNumber = searchController.page();
                    ModelCursor.setRoot(PageDefinition.page.model, d.data);

                    $scope.ModelCursor = ModelCursor;
                    $scope.current = ModelCursor.current;
                    $scope.action = ModelCursor.action;
                    searchController.turnSearchOff();
                    $scope.showLoadingScreen = false;
                });
        }

        PageCursor.initialize(PageDefinition.page);
        $scope.PageCursor = PageCursor;

        $scope.chooseModel = function(model) {
            $scope.currentModel = model;
        };
        $scope.chooseModel(PageDefinition.page.model.name);

        (function setupHotKeys() {
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
            keyboardManager.bind('shift+up', function () {
                var currentPage = searchController.page() || 1;
                if (currentPage > 1) {
                    searchController.page(currentPage - 1);
                }
            });
            keyboardManager.bind('shift+down', function () {
                var currentPage = searchController.page() || 1;
                var maxPages = 999; // TODO get the max from server
                if (currentPage < maxPages) {
                    searchController.page(currentPage + 1);
                }
            });

            keyboardManager.bind('ctrl+s', function () {
                $scope.save();
            });
            keyboardManager.bind('ctrl+shift+d', function () {
                console.log('DEBUGGING');
                ModelCursor.toConsole();
                PageCursor.toConsole();
            });

        })();

        (function addFormMethodsToScope(){
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
                    $scope.serverStatus = '';
                    $scope.serverError = status;
                    if (!status) {
                        ModelCursor.dirty = false;
                    }
                });
            };
        })();

        (function initializeSearchPage() {
            $scope.filterValues = {};
            $scope.filterComparators = {};

            _.forEach(PageDefinition.page.model.fields, function (field) {
                $scope.filterComparators[field.name] = 'Contains';
            });

            $scope.runSearch = function () {
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

        $scope.$on('$locationChangeSuccess', function () {
            initializePage();
        });

        function initializePage() {
            searchController.initialize();
            if (searchController.showSearch) {
                $scope.showLoadingScreen = false;
            } else {
                loadData();
            }
        }

        initializePage();
    });
