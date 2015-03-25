'use strict';
/* global _ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, keyboardManager, ModelSaver, $window, Logger) {

        var editCell = {};
        var MOUSE = {
            LEFT: 1,
            RIGHT: 3
        };

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
                sections: {},
                getSection: function (sectionName) {
                    if (!self.sections[sectionName]) {
                        $log.info('self.sections[sectionName] has not been created yet');
                        return;
                    }
                    return self.sections[sectionName];
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
                            self.maxPages = d.data.maxPages;
                            ModelCursor.setRoot(topModel, d.data.rows);
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
                        new SmartSection(section, self.sections);
                    });

                    self.topSection = self.sections[PageDefinition.page.sections[0].name];
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
                },
                showSearch: undefined,
                filterString: '',
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
                runSearch: function () {
                    $log.debug('runSearch()');
                    if (self.filterString) {
                        self.filter(self.filterString);
                    } else {
                        $location.search({});
                    }
                    self.loadData();
                },
                filter: function (newFilter) {
                    if (newFilter) {
                        console.info('Updating filter', newFilter);
                        $location.search('filter', newFilter);
                    }
                    return $location.search().filter;
                },
                maxPages: 99,
                page: function (newPage) {
                    if (newPage) {
                        console.info('Updating page', newPage);
                        $location.search('page', newPage);
                    }
                    return parseInt($location.search().page || 1);
                },
                showPagingOnSection: function (sectionName) {
                    if (self.maxPages > 1) {
                        return self.topSection.name === sectionName;
                    } else return false;
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

        var SmartSection = function (pageSection, sections) {
            $log.debug('Creating SmartSection ', pageSection);
            var VIEWMODE = {FORM: 'form', TABLE: 'table'};
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode,
                model: pageSection.model,
                fields: pageSection.fields,
                orderBy: {},
                orderByField: function(field) {
                    self.orderBy = {
                        field: field,
                        direction: (field === self.orderBy.field) ? !self.orderBy.direction : false
                    };
                    self.getCurrentSet().sort(self.orderBy.field, self.orderBy.direction);
                },
                toggleViewMode: function () {
                    if (self.viewMode === VIEWMODE.FORM) {
                        self.viewMode = VIEWMODE.TABLE;
                    } else {
                        self.selectedRows.end = self.selectedRows.start;
                        self.viewMode = VIEWMODE.FORM;
                    }
                    self.unbindHotKeys();
                    self.bindHotKeys();
                },
                copy: function () {
                    var currentSet = self.getCurrentSet();

                    // TODO Finish off the copy method
                    if (currentSet.selectedRows) {
                        $scope.clipboard = currentSet.selectedRows;
                        //_.cloneDeep(current.gridSelection);
                    }
                },
                paste: function () {
                    // TODO Finish off the paste method
                    if ($scope.clipboard && getCurrentSet().gridSelection) {
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
                getCurrentSet: function () {
                    return ModelCursor.getCurrentSet(self.model.name);
                },
                unbindHotKeys: function () {
                    _.forEach(keyboardManager.keyboardEvent, function (key, value) {
                        keyboardManager.unbind(value);
                    });
                },
                bindHotKeys: function () {
                    if (self.viewMode === VIEWMODE.TABLE) {
                        keyboardManager.bind('up', function () {
                            self.movePreviousRow();
                        });
                        keyboardManager.bind('down', function () {
                            self.moveNextRow();
                        });
                        keyboardManager.bind('right', function () {
                            self.moveNextColumn();
                        });
                        keyboardManager.bind('tab', function () {
                            self.moveNextColumn();
                        });
                        keyboardManager.bind('left', function () {
                            self.movePreviousColumn();
                        });
                        keyboardManager.bind('shift+tab', function () {
                            self.movePreviousColumn();
                        });
                        keyboardManager.bind('shift+up', function () {
                            self.selectUp();
                        });
                        keyboardManager.bind('shift+down', function () {
                            self.selectDown();
                        });
                        keyboardManager.bind('meta+c', function () {
                            self.copy();
                        });
                        keyboardManager.bind('meta+v', function () {
                            self.paste();
                        });
                    }
                    keyboardManager.bind('ctrl+t', function () {
                        self.toggleViewMode();
                    });
                    keyboardManager.bind('ctrl+d', function () {
                        self.getCurrentSet().delete();
                    });
                    keyboardManager.bind('ctrl+n', function () {
                        self.getCurrentSet().insert();
                    });
                },
                selectedRows: {start: 0, end: 0},
                selectedColumns: {start: 0, end: 0},
                cellIsSelected: function (row, column) {
                    var between = function(value, selection) {
                        if (selection.start > selection.end) {
                            return selection.start >= value && selection.end <= value;
                        } else {
                            return selection.start <= value && selection.end >= value;
                        }
                    };
                    return between(row, self.selectedRows) && between(column, self.selectedColumns);
                },
                movePreviousRow: function () {
                    self.selectedRows.start--;
                    self.selectedRows.end = self.selectedRows.start;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.fixSelectedRows();
                },
                moveNextRow: function () {
                    self.selectedRows.start++;
                    self.selectedRows.end = self.selectedRows.start;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.fixSelectedRows();
                },
                mousedown: function (row, column) {
                    if (event.which === MOUSE.LEFT) {
                        if (self.cellIsEditing(row, column)) {
                            return;
                        } else {
                            editCell = {};
                        }
                        self.selectedRows = {
                            selecting: true,
                            start: row,
                            end: row
                        };
                        self.selectedColumns = {
                            start: column,
                            end: column
                        };
                        self.mouseover(row, column);
                    }
                },
                mouseover: function (row, column) {
                    if (event.which === MOUSE.LEFT) {
                        if (self.cellIsEditing(row, column)) {
                            return;
                        }
                        if (self.selectedRows.selecting) {
                            self.selectedRows.end = row;
                            self.selectedColumns.end = column;
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                },
                mouseup: function () {
                    if (event.which === MOUSE.LEFT) {
                        self.selectedRows.selecting = false;
                        self.fixSelectedRows();
                    }
                },
                dblclick: function (row, column) {
                    if (event.which !== MOUSE.LEFT) {
                        return;
                    }
                    var currentField = self.fields[column];
                    var currentInstance = self.getInstance(row);
                    if (currentInstance.state !== "INSERTED" && !currentField.updateable) {
                        return;
                    }
                    editCell = {
                        model: self.model.modelName,
                        row: row,
                        column: column
                    };
                    //currentFocus = self.model.modelName + "_" + "_" + column + "_" + row;
                },
                getSelectedRows: function () {
                    return _.slice(this.rows, this.selectedRows.start, this.selectedRows.end);
                },
                delete: function () {
                    if (this.rows.length <= 0) {
                        return;
                    }

                    for (var index = this.selectedRows.start; index <= this.selectedRows.end; index++) {
                        var row = this.rows[index];
                        if (row.state !== 'INSERTED') {
                            // Only delete previously saved records
                            this.deleted.push(row);
                            row.updateParent();
                        }
                    }
                    this.rows.splice(this.selectedRows.start, 1 + this.selectedRows.end - this.selectedRows.start);

                    this.fixSelectedRows();
                },
                selectUp: function () {
                    self.selectedRows.end--;
                },
                selectDown: function () {
                    self.selectedRows.end++;
                },
                moveNextColumn: function() {
                    if (self.selectedColumns.start >= self.fields.length - 1) {
                        return;
                    }
                    if (!self.selectedColumns) {
                        self.selectedColumns.start = -1;
                    }
                    self.selectedColumns.start++;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.selectedRows.end = self.selectedRows.start;
                },
                movePreviousColumn: function() {
                    if (self.selectedColumns.start === 0) {
                        return;
                    }
                    self.selectedColumns.start--;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.selectedRows.end = self.selectedRows.start;
                },
                cellIsEditing: function (row, column) {
                    return editCell.model === self.model.modelName
                        && self.selectedRows.start === row
                        && editCell.column === column;
                },
                focus: function(row, column) {
                    if (self.cellIsEditing(row, column)) {
                        return true;
                        //return currentFocus === self.model.modelName + "_" + column + "_" + row;
                    }
                    return false;
                },
                fixSelectedRows: function() {
                    function constrainVariableBetween(current, low, high) {
                        if (current === undefined) return low;
                        if (current < low) return low;
                        if (current > high) return high;
                        return current;
                    }

                    if (self.getCurrentSet().rows.length === 0) {
                        self.selectedRows = {start: -1, end: -1};
                    } else {
                        var maxEnd = self.getCurrentSet().rows.length - 1;
                        self.selectedRows.start = constrainVariableBetween(self.selectedRows.start, 0, maxEnd);
                        self.selectedRows.end = constrainVariableBetween(self.selectedRows.end, 0, maxEnd);
                        //if (self.selectedRows.end < self.selectedRows.start) {
                        //    // Swap start and end since end should always be >= start
                        //    var temp = self.selectedRows.end;
                        //    self.selectedRows.end = self.selectedRows.start;
                        //    self.selectedRows.start = temp;
                        //}
                    }
                    self.getCurrentSet().index = self.selectedRows.start;
                    ModelCursor.resetCurrents(self.getCurrentSet());
                },
                editCell: function() { return editCell }
            };

            if (!sections) {
                sections = {};
            }
            sections[self.name] = self;

            _.forEach(pageSection.sections, function (section) {
                new SmartSection(section, sections);
            });
        };

        /**
         * Global clipboard
         * @type {null}
         */
        $scope.clipboard = null;

        function initializeSearchPage() {
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

                $scope.SmartPage.filterString = filterString;
            };

            setFilterString($scope.SmartPage.filterValues, $scope.SmartPage.filterComparators);
        }

        $scope.link = function (targetPage, filter, modelName) {
            var data = ModelCursor.getCurrentSet(modelName, 0).getSelectedRows();
            _.forEach(data.data, function (value, key) {
                filter = filter.replace('[' + key + ']', data.data[key]);
            });
            $window.location.href = '/page/' + targetPage + '/?filter=' + filter;
        };

        var page = new SmartPage(PageDefinition.page);
        $scope.SmartPage = page;
        initializeSearchPage();
        $scope.Logger = Logger;

        $scope.$on('$locationChangeSuccess', function () {
            $log.debug('$locationChangeSuccess()');
            if (page.showSearch) {
                page.showLoadingScreen = false;
            } else {
                page.loadData();
            }
        });

    });
