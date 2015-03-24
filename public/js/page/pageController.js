'use strict';
/* global _ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, keyboardManager, ModelSaver, $window, Logger) {

        var SmartPage = function (page) {
            var searchPath = '/search';
            var self = {
                /**
                 * A pointer to the currently selected section. Useful for key binding and such.
                 */
                current: null,
                topSection: null,
                /**
                 * A list of each section on the page
                 */
                sections: [],
                getSection: function (sectionName, level) {
                    level = 0; // Will probably remove level
                    if (!self.sections[level] || !self.sections[level][sectionName]) {
                        $log.info('self.sections[level][sectionName] has not been created yet');
                        return;
                    }
                    return self.sections[level][sectionName];
                },
                showLoadingScreen: true,
                loadingFailed: false,
                loadData: function () {
                    Logger.info('Loading data...');
                    Logger.error('');

                    var topModel = self.topSection.model;
                    PageService.readModelData(topModel.name, self.filter(), self.page())
                        .then(function (d) {
                            Logger.info('');
                            if (d.status !== 200) {
                                Logger.error('Failed to reach server. Try refreshing.');
                                self.loadingFailed = true;
                                return;
                            }
                            if (d.data.error) {
                                Logger.error('Error reading data from server: ' + d.data.error.message);
                                self.loadingFailed = true;
                                return;
                            }
                            //self.filterString = self.filter();
                            //self.pageNumber = SearchController.page();
                            self.maxPages = d.data.maxPages;
                            ModelCursor.setRoot(topModel, d.data.rows);
                            self.initialize(PageDefinition.page, d.data.rows);
                            self.turnSearchOff();
                            self.showLoadingScreen = false;
                        });
                },

                refresh: function () {
                    $log.debug('refresh()');
                    if (ModelCursor.dirty() && !Logger.getStatus()) {
                        Logger.info('There are unsaved changes. Click [Refresh] again to discard those changes.');
                        return;
                    }
                    self.loadData();
                },
                save: function () {
                    Logger.info('Saving...');
                    ModelSaver.save(self.topSection.model, ModelCursor.root, function (error) {
                        Logger.info('');
                        Logger.error(error);
                    });
                },
                focus: function (section) {
                    if (self.current) self.current.unbindHotKeys();
                    self.current = section;
                    section.bindHotKeys();
                },
                bind: function () {
                    keyboardManager.bind('ctrl+s', function () {
                        self.save();
                    });
                    keyboardManager.bind('meta+s', function () {
                        self.save();
                    });
                    keyboardManager.bind('ctrl+shift+d', function () {
                        self.toConsole();
                    });
                },
                toConsole: function () {
                    console.log('SmartPage.current', self.current);
                    console.log('SmartPage.sections', self.sections);
                    ModelCursor.toConsole();
                },
                initialize: function (p) {
                    $log.debug('SmartPage.initialize()', p);
                    _.forEach(p.sections, function (section) {
                        new SmartSection(section, 0, self.sections);
                    });

                    self.topSection = self.sections[0][PageDefinition.page.sections[0].name];
                    self.showSearch = $location.path() === searchPath;

                    angular.forEach(self.topSection.fields, function (field) {
                        switch (field.fieldType) {
                            case 'checkbox':
                                console.info(field.fieldType);
                                self.filterValues[field.name] = null;
                                self.filterComparators[field.name] = 'Equals';
                                break;
                            default:
                                self.filterComparators[field.name] = 'Contains';
                        }
                    });
                    self.filter();
                    self.focus(self.topSection);

                    // Not sure we need this here
                    //page.loadData();
                },
                showSearch: undefined,
                filterValues: {},
                filterComparators: {},
                turnSearchOn: function () {
                    $location.path(searchPath);
                    self.showSearch = true;
                },
                turnSearchOff: function () {
                    $location.path('/');
                    self.showSearch = false;
                },
                runSearch: function() {
                    $log.debug('runSearch()');
                    if ($scope.filterString) {
                        self.filter($scope.filterString);
                    } else {
                        $location.search({});
                    }
                    self.loadData();
                },
                filter: function (newFilter) {
                    if (newFilter) {
                        $location.search('filter', newFilter);
                    }
                    return $location.search().filter;
                },
                maxPages: 99,
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
            self.initialize(page);
            return self;
        };

        var SmartSection = function (pageSection, level, sections) {
            $log.debug('Creating SmartSection ', pageSection);
            var VIEWMODE = {FORM: 'form', TABLE: 'table'};
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode,
                model: pageSection.model,
                fields: pageSection.fields,
                toggleViewMode: function () {
                    console.info('toggleViewMode', this);
                    if (self.viewMode === VIEWMODE.FORM) {
                        self.viewMode = VIEWMODE.TABLE;
                    } else {
                        var currentSet = self.getCurrentSet();
                        currentSet.selectedRows.end = currentSet.selectedRows.start;
                        self.viewMode = VIEWMODE.FORM;
                    }
                },
                copy: function () {
                    // TODO Finish off the copy method
                    if (getCurrentSet().gridSelection) {
                        clipboard = _.cloneDeep(current.gridSelection);
                    }
                },
                paste: function () {
                    // TODO Finish off the paste method
                    if (clipboard && getCurrentSet().gridSelection) {
                        var fromRows = getRows(clipboard);
                        var toRows = getRows(current.gridSelection);

                        var counter = 0;
                        _.forEach(toRows, function (targetRow) {
                            if (counter >= fromRows.length) counter = 0;
                            var fromRow = fromRows[counter];
                            _.forEach(current.gridSelection.columns, function (yes, columnName) {
                                targetRow.update(columnName, fromRow.data[columnName]);
                            });
                            counter++;
                        });
                    }
                },
                level: 0, // level || will probably remove level
                getCurrentSet: function () {
                    //console.warn('pageController.getCurrentSet()', self.model.name, self.level);
                    return ModelCursor.getCurrentSet(self.model.name, self.level);
                },
                unbindHotKeys: function () {
                    _.forEach(keyboardManager.keyboardEvent, function (key, value) {
                        keyboardManager.unbind(value);
                    });
                },
                bindHotKeys: function () {
                    keyboardManager.bind('up', function () {
                        self.getCurrentSet().movePrevious();
                    });
                    keyboardManager.bind('tab', function () {
                        self.getCurrentSet().moveNext();
                    });
                    keyboardManager.bind('enter', function () {
                        self.getCurrentSet().moveNext();
                    });
                    keyboardManager.bind('down', function () {
                        self.getCurrentSet().moveNext();
                    });
                    keyboardManager.bind('ctrl+d', function () {
                        self.getCurrentSet().delete();
                    });
                    keyboardManager.bind('ctrl+n', function () {
                        self.getCurrentSet().insert();
                    });
                    keyboardManager.bind('meta+c', function () {
                        self.copy();
                    });
                    keyboardManager.bind('meta+v', function () {
                        self.paste();
                    });
                }
            };

            if (!sections[self.level]) {
                sections[self.level] = {};
            }
            sections[self.level][self.name] = self;

            _.forEach(pageSection.sections, function (section) {
                // Maybe we should only increase level if the lower section has it's own model
                new SmartSection(section, self.level + 1, sections);
            });
        };

        /**
         * Global clipboard
         * @type {null}
         */
        var clipboard = null;

        (function initializeSearchPage() {
            // TODO Not done yet
            $scope.$watch('SmartPage.filterValues', function (newVal) {
                setFilterString(newVal, $scope.SmartPage.filterComparators);
            }, true);

            $scope.$watch('SmartPage.filterComparators', function (newVal) {
                setFilterString($scope.SmartPage.filterValues, newVal);
            }, true);

            var setFilterString = function (filterValues, filterComparators) {
                var filterString = '';

                angular.forEach(filterValues, function (value, fieldName) {
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

        $scope.link = function (targetPage, filter, modelName) {
            var data = ModelCursor.getCurrentSet(modelName, 0).getSelectedRows();
            _.forEach(data.data, function (value, key) {
                filter = filter.replace('[' + key + ']', data.data[key]);
            });
            $window.location.href = '/page/' + targetPage + '/?filter=' + filter;
        };

        $scope.$on('$locationChangeSuccess', function () {
            $log.debug('$locationChangeSuccess()');
            $scope.Logger = Logger;
            var page = new SmartPage(PageDefinition.page);
            $scope.SmartPage = page;

            if (page.showSearch) {
                page.showLoadingScreen = false;
            } else {
                page.loadData();
            }
        });
    });
