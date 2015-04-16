'use strict';
/* global _ */
/* global $ */
/* global angular */

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, keyboardManager, ModelSaver, $window, $http, Logger) {


        $scope.buttons = $window.buttons;
        /**
         * buttonScope is used in section.scala.html
         */
        $scope.buttonScope = {
            // Deprecated
            PageService: PageService,
            // Deprecated
            $http: $http,
            Http: $http,
            Logger: Logger,
            Server: {
                read: PageService.readModelData
            }
        };

        $scope.showDevelopmentTools = false;
        keyboardManager.bind('meta+alt+t', function () {
            $scope.showDevelopmentTools = !$scope.showDevelopmentTools;
        });

        /**
         * You can only edit a single cell in a single section at a time so this is a global var (page level at least)
         * @type {null}
         */
        var editSection = null;
        var MOUSE = {
            LEFT: 1,
            RIGHT: 3
        };

        var Selector = function () {
            var selector = {
                start: 0,
                end: 0,
                getStart: function () {
                    return selector.start < selector.end ? selector.start : selector.end;
                },
                getEnd: function () {
                    return selector.start < selector.end ? selector.end : selector.start;
                },
                between: function (value) {
                    return selector.getStart() <= value && value <= selector.getEnd();
                },
                length: function () {
                    return selector.getEnd() - selector.getStart();
                }
            };
            return selector;
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

                    function processResults(d) {
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
                        self.topSection.fixSelectedRows();
                        self.showLoadingScreen = false;
                    }

                    var topModel = self.topSection.model;
                    if (topModel.customUrlSource) {
                        PageService.readUrl(topModel.customUrlSource).then(processResults);
                    } else {
                        PageService.readModelData(topModel.name, self.filter(), self.page()).then(processResults);
                    }
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
                bindHotKeys: function () {
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
                orderByField: function (field) {
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
                        self.stopEditing();
                        self.viewMode = VIEWMODE.FORM;
                    }
                    self.unbindHotKeys();
                    self.bindHotKeys();
                },
                copy: function () {
                    var rowsToCopy = self.getCurrentSet().rows.slice(
                        self.selectedRows.getStart(),
                        self.selectedRows.getEnd() + 1);

                    $scope.clipboard = [];
                    angular.forEach(rowsToCopy, function (row) {
                        var rowCopy = [];
                        angular.forEach(self.fields, function (field, colIndex) {
                            if (self.selectedColumns.between(colIndex)) {
                                rowCopy.push(row.data[field.name]);
                            }
                        });
                        $scope.clipboard.push(rowCopy);
                    });

                    var clipboardToExcel = $scope.clipboard.map(function (row) {
                        return row.join('\t');
                    }).join('\n');

                    var clipboardElement = $('#clipboard');
                    clipboardElement.val(clipboardToExcel);
                    clipboardElement.select();
                },
                paste: function () {
                    if ($scope.clipboard.length > 0) {
                        var rowsToPaste = self.getCurrentSet().rows.slice(
                            self.selectedRows.getStart(),
                            self.selectedRows.getEnd() + 1);

                        var rowCounter = 0,
                            clipboardRowLength = $scope.clipboard.length,
                            clipboardColumnLength = $scope.clipboard[0].length;

                        angular.forEach(rowsToPaste, function (targetRow) {
                            var sourceRow = $scope.clipboard[rowCounter];
                            var colCounter = 0;
                            angular.forEach(self.fields, function (field, colIndex) {
                                if (self.selectedColumns.between(colIndex)) {
                                    targetRow.update(field.name, sourceRow[colCounter]);
                                    colCounter++;
                                    if (clipboardColumnLength === colCounter) {
                                        colCounter = 0;
                                    }
                                }
                            });
                            rowCounter++;
                            if (clipboardRowLength === rowCounter) {
                                rowCounter = 0;
                            }
                        });
                    }
                },
                getCurrentSet: function () {
                    return ModelCursor.getCurrentSet(self.model.name);
                },
                unbindHotKeys: function () {
                    self.bound = false;
                    var ctrl = 'meta';
                    var sectionKeys = ['up', 'down', 'right', 'left', 'shift+tab', 'shift+down', ctrl + '+c', ctrl + '+v', ctrl + '+t', ctrl + '+d', ctrl + '+i'];
                    angular.forEach(sectionKeys, function (key) {
                        keyboardManager.unbind(key);
                    });
                },
                bindHotKeys: function () {
                    if (self.bound) {
                        return;
                    }
                    self.bound = true;
                    // TODO detect if this is windows or mac
                    var ctrl = 'meta';
                    if (self.viewMode === VIEWMODE.TABLE) {
                        keyboardManager.bind('up', function () {
                            self.moveToPreviousRow();
                        });
                        keyboardManager.bind('down', function () {
                            self.moveToNextRow();
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
                        keyboardManager.bind(ctrl + '+c', function () {
                            self.copy();
                        }, {propagate: true});
                        keyboardManager.bind(ctrl + '+v', function () {
                            self.paste();
                        }, {propagate: true});
                    }
                    keyboardManager.bind('ctrl+t', function () {
                        self.toggleViewMode();
                    });
                    keyboardManager.bind(ctrl + '+d', function () {
                        self.delete();
                    });
                    keyboardManager.bind(ctrl + '+i', function () {
                        self.insert();
                    });
                },
                selectedRows: new Selector(),
                selectedColumns: new Selector(),
                hover: {},
                selectRow: function (row) {
                    self.selectedRows.start = self.selectedRows.end = row;
                    self.fixSelectedRows();
                },
                rowIsSelected: function (row) {
                    return self.selectedRows.between(row);
                },
                cellIsSelected: function (row, column) {
                    return self.selectedRows.between(row) && self.selectedColumns.between(column);
                },
                moveToPreviousRow: function () {
                    self.selectedRows.start--;
                    self.selectedRows.end = self.selectedRows.start;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.fixSelectedRows();
                },
                moveToNextRow: function () {
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
                            editSection = null;
                        }
                        self.selectedRows.selecting = true;
                        self.selectedRows.start = self.selectedRows.end = row;
                        self.selectedColumns.start = self.selectedColumns.end = column;
                        self.mouseover(row, column);
                    }
                },
                mouseover: function (row, column) {
                    self.hover = {
                        row: row,
                        column: column
                    };

                    if (self.cellIsEditing(row, column)) {
                        return;
                    }
                    if (self.selectedRows.selecting) {
                        self.selectedRows.end = row;
                        self.selectedColumns.end = column;
                        event.preventDefault();
                        event.stopPropagation();
                    }
                },
                isHoveredOverCell: function (row, column) {
                    return self.hover.row === row && self.hover.column === column;
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
                    self.startEditing(row, column);
                },
                startEditing: function (row, column) {
                    row = row || self.selectedRows.start;
                    column = column || self.selectedColumns.start;

                    var currentField = self.fields[column];
                    // TODO We need to solve the issue when we start editing an editable field and then tab to one that's not
                    var currentInstance = self.getCurrentSet().getInstance(row);
                    if (!currentInstance.isFieldEditable(currentField.name)) {
                        console.warn(currentField.name + ' is not editable');
                        return;
                    }
                    editSection = self.name;
                    keyboardManager.bind('esc', function () {
                        self.stopEditing();
                    });
                    keyboardManager.bind('enter', function () {
                    });
                    self.unbindHotKeys();
                },
                stopEditing: function () {
                    editSection = null;
                    keyboardManager.unbind('esc');
                    keyboardManager.bind('enter', function () {
                        self.startEditing();
                    });
                    self.bindHotKeys();
                },

                getSelectedRows: function () {
                    return _.slice(self.getCurrentSet().rows, self.selectedRows.start, self.selectedRows.end + 1);
                },
                insert: function () {
                    self.getCurrentSet().insert();
                    self.selectedRows.start = self.selectedRows.end = self.getCurrentSet().index;
                    self.fixSelectedRows();
                },
                delete: function () {
                    for (var index = self.selectedRows.start; index <= self.selectedRows.end; index++) {
                        self.getCurrentSet().delete(self.selectedRows.start);
                    }

                    self.selectedRows.end = self.selectedRows.start;
                    self.fixSelectedRows();
                },
                selectUp: function () {
                    self.selectedRows.end--;
                },
                selectDown: function () {
                    self.selectedRows.end++;
                },
                moveNextColumn: function () {
                    if (self.selectedColumns.start >= (self.fields.length - 1)) {
                        return;
                    }
                    if (!self.selectedColumns) {
                        self.selectedColumns.start = -1;
                    }
                    self.selectedColumns.start++;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.selectedRows.end = self.selectedRows.start;
                },
                movePreviousColumn: function () {
                    if (self.selectedColumns.start === 0) {
                        return;
                    }
                    self.selectedColumns.start--;
                    self.selectedColumns.end = self.selectedColumns.start;
                    self.selectedRows.end = self.selectedRows.start;
                },
                cellIsEditing: function (row, column) {
                    return editSection === self.name &&
                        self.selectedRows.start === row &&
                        self.selectedColumns.start === column;
                },
                focus: function (row, column) {
                    if (self.cellIsEditing(row, column)) {
                        return true;
                    }
                    return false;
                },
                fixSelectedRows: function () {
                    function constrainVariableBetween(current, low, high) {
                        if (current === undefined) return low;
                        if (current < low) return low;
                        if (current > high) return high;
                        return current;
                    }

                    if (self.getCurrentSet().rows.length === 0) {
                        self.selectedRows.start = self.selectedRows.end = -1;
                    } else {
                        var maxEnd = self.getCurrentSet().rows.length - 1;
                        self.selectedRows.start = constrainVariableBetween(self.selectedRows.start, 0, maxEnd);
                        self.selectedRows.end = constrainVariableBetween(self.selectedRows.end, 0, maxEnd);
                    }
                    self.getCurrentSet().index = self.selectedRows.start;
                    ModelCursor.resetCurrents(self.getCurrentSet());
                }
            };

            if (!sections) {
                sections = {};
            }
            if (sections[self.name]) {
                console.warn('Duplicate section named ' + self.name);
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
        $scope.clipboard = [];
        $scope.clipboardToExcel = '';

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

        $scope.link = function (targetPage, filter, sectionName) {
            var row = page.getSection(sectionName).getCurrentSet().getInstance();
            // TODO link from all selected rows (getSelectedRows)
            _.forEach(row.data, function (value, key) {
                // Should drop support for [] in favor of ${} most likely
                filter = filter.replace('[' + key + ']', row.data[key]);
                filter = filter.replace('${' + key + '}', row.data[key]);
            });
            var openInNew = true;
            if (openInNew) {
                $window.open('/page/' + targetPage + '/?filter=' + filter);
            } else {
                // TODO Figure out if the ctrl button is down...maybe in a directive with event
                $window.location.href = '/page/' + targetPage + '/?filter=' + filter;
            }
        };

        var page = new SmartPage(PageDefinition.page);
        page.bindHotKeys();
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
