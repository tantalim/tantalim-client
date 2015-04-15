'use strict';
// Source: public/js/page/_app.js
angular.module('tantalim.desktop', ['tantalim.common', 'ngRoute', 'ui.bootstrap', 'ngSanitize']);

// Source: public/js/page/keyboardManager.js
/* istanbul ignore next */
angular.module('tantalim.desktop')
    .factory('keyboardManager', ['$window', '$timeout', function ($window, $timeout) {
        var keyboardManagerService = {};

        var defaultOpt = {
            'type': 'keydown',
            'propagate': false,
            'inputDisabled': false,
            'target': $window.document,
            'keyCode': false
        };
        // Store all keyboard combination shortcuts
        keyboardManagerService.keyboardEvent = {};
        // Add a new keyboard combination shortcut
        keyboardManagerService.bind = function (label, callback, opt) {
            var fct, elt, code, k;
            // Initialize opt object
            opt = angular.extend({}, defaultOpt, opt);
            label = label.toLowerCase();
            elt = opt.target;
            if (typeof opt.target === 'string') elt = document.getElementById(opt.target);

            fct = function (e) {
                e = e || $window.event;

                // Disable event handler when focus input and textarea
                if (opt.inputDisabled) {
                    var elt;
                    if (e.target) elt = e.target;
                    else if (e.srcElement) elt = e.srcElement;
                    if (elt.nodeType === 3) elt = elt.parentNode;
                    if (elt.tagName === 'INPUT' || elt.tagName === 'TEXTAREA') return;
                }

                // Find out which key is pressed
                if (e.keyCode) code = e.keyCode;
                else if (e.which) code = e.which;
                var character = String.fromCharCode(code).toLowerCase();

                if (code === 188) character = ','; // If the user presses , when the type is onkeydown
                if (code === 190) character = '.'; // If the user presses , when the type is onkeydown

                var keys = label.split('+');
                // Key Pressed - counts the number of valid keypresses - if it is same as the number of keys, the shortcut function is invoked
                var kp = 0;
                // Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
                var shift_nums = {
                    '`': '~',
                    '1': '!',
                    '2': '@',
                    '3': '#',
                    '4': '$',
                    '5': '%',
                    '6': '^',
                    '7': '&',
                    '8': '*',
                    '9': '(',
                    '0': ')',
                    '-': '_',
                    '=': '+',
                    ';': ':',
                    '\'': '\"',
                    ',': '<',
                    '.': '>',
                    '/': '?',
                    '\\': '|'
                };
                // Special Keys - and their codes
                var special_keys = {
                    'esc': 27,
                    'escape': 27,
                    'tab': 9,
                    'space': 32,
                    'return': 13,
                    'enter': 13,
                    'backspace': 8,

                    'scrolllock': 145,
                    'scroll_lock': 145,
                    'scroll': 145,
                    'capslock': 20,
                    'caps_lock': 20,
                    'caps': 20,
                    'numlock': 144,
                    'num_lock': 144,
                    'num': 144,

                    'pause': 19,
                    'break': 19,

                    'insert': 45,
                    'home': 36,
                    'delete': 46,
                    'end': 35,

                    'pageup': 33,
                    'page_up': 33,
                    'pu': 33,

                    'pagedown': 34,
                    'page_down': 34,
                    'pd': 34,

                    'left': 37,
                    'up': 38,
                    'right': 39,
                    'down': 40,

                    'f1': 112,
                    'f2': 113,
                    'f3': 114,
                    'f4': 115,
                    'f5': 116,
                    'f6': 117,
                    'f7': 118,
                    'f8': 119,
                    'f9': 120,
                    'f10': 121,
                    'f11': 122,
                    'f12': 123
                };
                // Some modifiers key
                var modifiers = {
                    shift: {
                        wanted: false,
                        pressed: !!e.shiftKey
                    },
                    ctrl: {
                        wanted: false,
                        pressed: !!e.ctrlKey
                    },
                    alt: {
                        wanted: false,
                        pressed: !!e.altKey
                    },
                    meta: { //Meta is Mac specific
                        wanted: false,
                        pressed: !!e.metaKey
                    }
                };
                // Foreach keys in label (split on +)
                for (var i = 0, l = keys.length; k = keys[i], i < l; i++) {
                    switch (k) {
                        case 'ctrl':
                        case 'control':
                            kp++;
                            modifiers.ctrl.wanted = true;
                            break;
                        case 'shift':
                        case 'alt':
                        case 'meta':
                            kp++;
                            modifiers[k].wanted = true;
                            break;
                    }

                    if (k.length > 1) { // If it is a special key
                        if (special_keys[k] === code) kp++;
                    } else if (opt.keyCode) { // If a specific key is set into the config
                        if (opt.keyCode === code) kp++;
                    } else { // The special keys did not match
                        if (character === k) kp++;
                        else {
                            if (shift_nums[character] && e.shiftKey) { // Stupid Shift key bug created by using lowercase
                                character = shift_nums[character];
                                if (character === k) kp++;
                            }
                        }
                    }
                }

                if (kp === keys.length &&
                    modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
                    modifiers.shift.pressed === modifiers.shift.wanted &&
                    modifiers.alt.pressed === modifiers.alt.wanted &&
                    modifiers.meta.pressed === modifiers.meta.wanted) {
                    $timeout(function () {
                        callback(e);
                    }, 1);

                    if (!opt.propagate) { // Stop the event
                        // e.cancelBubble is supported by IE - this will kill the bubbling process.
                        e.cancelBubble = true;
                        e.returnValue = false;

                        // e.stopPropagation works in Firefox.
                        if (e.stopPropagation) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                        return false;
                    }
                }

            };
            // Store shortcut
            keyboardManagerService.keyboardEvent[label] = {
                'callback': fct,
                'target': elt,
                'event': opt.type
            };
            //Attach the function with the event
            if (elt.addEventListener) elt.addEventListener(opt.type, fct, false);
            else if (elt.attachEvent) elt.attachEvent('on' + opt.type, fct);
            else elt['on' + opt.type] = fct;
        };
        // Remove the shortcut - just specify the shortcut and I will remove the binding
        keyboardManagerService.unbind = function (label) {
            label = label.toLowerCase();
            var binding = keyboardManagerService.keyboardEvent[label];
            delete(keyboardManagerService.keyboardEvent[label]);
            if (!binding) return;
            var type = binding.event,
                elt = binding.target,
                callback = binding.callback;
            if (elt.detachEvent) elt.detachEvent('on' + type, callback);
            else if (elt.removeEventListener) elt.removeEventListener(type, callback, false);
            else elt['on' + type] = false;
        };
        //
        return keyboardManagerService;
    }]);

// Source: public/js/page/main.js
angular.module('tantalim.desktop')
    .config(function ($locationProvider, $logProvider) {
        $locationProvider.html5Mode(true).hashPrefix('!');
        $logProvider.debugEnabled(true);
    })
;

// Source: public/js/page/pageController.js
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
            $window.location.href = '/page/' + targetPage + '/?filter=' + filter;
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

// Source: public/js/page/ui/checkbox.js
angular.module('tantalim.desktop')
    .directive('tntCheckbox', function () {
        return {
            restrict: 'E',
            controllerAs: '$checkbox',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.help = $attrs.help;

                var targetField = $attrs.targetField;
                var required = $attrs.required === 'true';
                ctrl.toggle = function () {
                    $scope.currentInstance.toggle(targetField, required);
                    setValue($scope.currentInstance);
                };

                function setValue(instance) {
                    if (instance) {
                        ctrl.value = instance.data[targetField];
                    } else {
                        ctrl.value = null;
                    }
                }

                $scope.$watch('currentInstance', setValue);
            },
            scope: {
                currentInstance: '='
            },

            transclude: true,
            template: '<div class="checkbox"><span ng-transclude></span>' +
            '<label class="control-label no-select" class="ui-checkbox" for="{{$checkbox.id}}" data-ng-click="$checkbox.toggle()">' +
            '<i data-ng-show="$checkbox.value === true" class="fa fa-lg fa-fw fa-check-square-o"></i>' +
            '<i data-ng-show="$checkbox.value === false" class="fa fa-lg fa-fw fa-square-o"></i>' +
            '<i data-ng-show="$checkbox.value === null || $checkbox.value === undefined" class="fa fa-lg fa-fw fa-square-o disabled"></i>' +
            ' {{$checkbox.label}} </label>' +
            '<span data-ng-show="$checkbox.help" class="help-block"><i class="fa fa-info-circle"></i> {{$checkbox.help}}</span>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/focusMe.js
/* global angular */

angular.module('tantalim.desktop')
    .directive('focusMe', function ($timeout) {
        return {
            scope: {trigger: '=focusMe'},
            link: function (scope, element) {
                scope.$watch('trigger', function (value) {
                    if (value === true) {
                        $timeout(function () {
                            element[0].focus();
                            element[0].select();
                        });
                    }
                });
            }
        };
    });

// Source: public/js/page/ui/grid.js
angular.module('tantalim.desktop')
    .directive('tntGrid', function () {
        return {
            restrict: 'E',
            controllerAs: '$grid',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.help = $attrs.help;
                ctrl.id = '123';
                ctrl.width = 200;

                var targetField = $attrs.targetField;
                var required = $attrs.required === 'true';
                ctrl.toggle = function () {
                    $scope.currentInstance.toggle(targetField, required);
                    setValue($scope.currentInstance);
                };

                function setValue(instance) {
                    if (instance) {
                        ctrl.value = instance.data[targetField];
                    } else {
                        ctrl.value = null;
                    }
                }

                $scope.$watch('currentInstance', setValue);
            },
            transclude: true,
            template: '<div class="tnt-grid tnt-grid-{{$grid.id}}">' +
            '<style> .tnt-grid-{{$grid.id}} { width: {{$grid.width}}px; }</style>{{$grid.id}}' +
            '' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/help.js
angular.module('tantalim.desktop')
    .directive('tntHelp', function () {
        return {
            restrict: 'E',
            transclude: true,
            link: function (scope, elem, attrs) {
                scope.title = attrs.label ? 'Help for ' + attrs.label : '';
            },
            template: '<div class="tnt-links">' +
            '<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true"><i class="fa fa-question"></i></button>' +
            '<div role="menu" aria-labelledby="dropdownMenu1" class="panel panel-default dropdown-menu dropdown-menu-right">' +
            '<div class="panel-heading" data-ng-show="title"><h3 class="panel-title">{{title}} <span class="pull-right"><i class="fa fa-question"></i></span></h3></div>' +
            '<div class="panel-body" ng-transclude></div></div>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/link.js
angular.module('tantalim.desktop')
    .directive('tntLinks', function () {
        return {
            restrict: 'E',
            transclude: true,
            template: '<div class="dropdown tnt-links">' +
            '<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true">' +
            '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>' +
            '<ul class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1" ng-transclude></ul></div>'
        };
    })
    .directive('tntLink', function ($compile) {
        return {
            restrict: 'E',
            compile: function CompilingFunction() {
                return function LinkingFunction($scope, $element, $attrs) {
                    //$scope.link = {
                    //    label: $attrs.label,
                    //    target: $attrs.target,
                    //    filter: $attrs.filter,
                    //    field: $attrs.field
                    //};
                    var html ='<li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-ng-click="link(\'' +
                        $attrs.target + '\', \'' +
                        ($attrs.filter.replace(/'/g, '\\\'').replace(/"/g, '\\\'') || '') + '\', \'' +
                        ($attrs.section || '') + '\')">' +
                        $attrs.label + '</a></li>';
                    var e = $compile(html)($scope);
                    $element.replaceWith(e);
                };
            }
        };
    })
;

// Source: public/js/page/ui/section.js
angular.module('tantalim.desktop')
    .directive('tntSection', function () {
        return {
            restrict: 'E',
            controllerAs: '$section',
            controller: function ($scope, $attrs) {
                var ctrl = this;
                ctrl.id = $attrs.id;
                ctrl.title = $attrs.title;
                ctrl.current = $attrs.current;
            },
            transclude: true,
            template: '<div id="{{$section.id}}" class="tntSection childSection">' +
            '<h2>{{$section.title}}</h2>' +
            '<div data-ng-hide="hide{{$section.id}} || {{$section.current}}.getCurrentSet().rows.length">' +
            '<div ng-transclude></div>' +
            '</div>'
        };
    })
    .directive('tntForm', function () {
        return {
            restrict: 'E',
            controllerAs: '$form',
            controller: function ($scope, $attrs) {
                var ctrl = this;
                ctrl.id = $attrs.id;
            },
            transclude: true,
            template: '<div id="$section.id" class="tntSection childSection">' +
            '<div ng-transclude></div>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/select.js
/* global _ */

angular.module('tantalim.desktop')
    .directive('tntSelect', function () {
        return {
            restrict: 'E',
            controllerAs: '$select',
            controller: function ($scope, $timeout, $attrs, $element, $location, focus, PageService) {

                var EMPTY_SEARCH = '';

                var ctrl = this;
                ctrl.empty = false;
                ctrl.open = false;
                ctrl.activeIndex = undefined;
                ctrl.items = undefined;

                ctrl.label = $attrs.label;
                var sourceField = $attrs.sourceField;
                ctrl.sourceField = $attrs.sourceField; // sourceField is referenced in the template so it has to be part of ctrl
                var targetId = $attrs.targetId;
                var targetField = $attrs.targetField;
                var otherMappings;
                if ($attrs.otherMappings) {
                    console.info('Eval ' + $attrs.otherMappings);
                    otherMappings = $scope.$eval($attrs.otherMappings);
                }
                var previousFilter = '';
                ctrl.id = targetField;

                var openItems = function () {
                    ctrl.open = true;
                    ctrl.activeIndex = undefined;
                    var currentInstance = $scope.currentInstance;
                    if (currentInstance) {
                        for (var i = 0; i < ctrl.items.length; i++) {
                            var item = ctrl.items[i];
                            if (targetId) {
                                if (item.id === currentInstance.data[targetId]) {
                                    ctrl.activeIndex = i;
                                }
                            } else {
                                if (item.data[sourceField] === currentInstance.data[targetField]) {
                                    ctrl.activeIndex = i;
                                }
                            }
                        }
                    }
                };

                ctrl.activate = function () {
                    var sourceItemText = $attrs.sourceItems;
                    if (sourceItemText) {
                        if (ctrl.items === undefined) {
                            ctrl.items = $scope.$eval(sourceItemText);
                        }
                        openItems();
                        return;
                    }

                    var sourceFilter = $attrs.sourceFilter;
                    if (sourceFilter) {
                        var pat = /\${(\w+)}/gi;
                        sourceFilter = sourceFilter.replace(pat, function (match, fieldName) {
                            var currentValue = $scope.currentInstance.getValue(fieldName);
                            if (currentValue === undefined) {
                                throw new Error('You must select ' + fieldName + ' first');
                            }
                            return currentValue;
                        });
                    }
                    if (ctrl.items === undefined || previousFilter !== sourceFilter) {
                        ctrl.loading = true;
                        ctrl.filter = EMPTY_SEARCH;
                        // TODO Support filtering the list if it's really long
                        //if (ctrl.filter) {
                        //    whereClause.push({ctrl.filter});
                        //}
                        console.info('readModelData where', sourceFilter);
                        PageService.readModelData($attrs.sourceModel, sourceFilter).then(function (d) {
                            ctrl.loading = false;
                            if (d.status !== 200) {
                                // TODO Need to figure out how to bubble up these error messages to global
                                // We should probably create a global Error Message handler
                                $scope.serverError = 'Failed to reach server. Try refreshing.';
                                console.error('Failed to reach server. Try refreshing.');
                                console.error(d);
                                return;
                            }
                            if (d.data.error) {
                                $scope.serverError = 'Error reading data from server: ' + d.data.error;
                                console.error('Error reading data from server:', d.data.error);
                                return;
                            }
                            ctrl.items = d.data.rows;
                            previousFilter = sourceFilter;
                            openItems();
                        });
                    } else {
                        openItems();
                    }
                    focus('select-search-' + ctrl.id);
                };

                ctrl.choose = function (item) {
                    var currentInstance = $scope.currentInstance;
                    currentInstance.update(targetField, item.data[sourceField]);
                    ctrl.display = currentInstance.data[targetField];
                    if (targetId) {
                        currentInstance.data[targetId] = item.id;
                    }

                    if (otherMappings) {
                        console.info('updating otherMappings ', otherMappings);
                        _.forEach(otherMappings, function (mapping) {
                            currentInstance.update(mapping.target, item.data[mapping.source]);
                        });
                    }
                    ctrl.open = false;
                    ctrl.empty = false;
                    focus('select-button-' + ctrl.id);
                };

                var Key = {
                    Enter: 13,
                    Tab: 9,
                    Up: 38,
                    Down: 40,
                    Escape: 27
                };

                ctrl.keydown = function (key) {
                    switch (key) {
                        case Key.Down:
                            if (ctrl.activeIndex < ctrl.items.length - 1) {
                                ctrl.activeIndex++;
                            } else {
                                ctrl.activeIndex = 0;
                            }
                            break;
                        case Key.Up:
                            if (ctrl.activeIndex > 0) {
                                ctrl.activeIndex--;
                            } else {
                                ctrl.activeIndex = ctrl.items.length - 1;
                            }
                            break;
                        case Key.Tab:
                        case Key.Enter:
                            ctrl.choose(ctrl.items[ctrl.activeIndex]);
                            break;
                        case Key.Escape:
                            ctrl.open = false;
                            focus('select-button-' + ctrl.id);
                            break;
                        default:
                            return false;
                    }
                    return true;
                };

                var _scrollToActiveRow = function () {
                    if (ctrl.open && ctrl.items.length > 0 && ctrl.activeIndex !== undefined) {
                        var container = $element[0].querySelectorAll('.ui-select-choices-content')[0];
                        var rows = container.querySelectorAll('.ui-select-choices-row');

                        if (rows.length === 0) {
                            // the rows aren't there before it opens generated yet
                            container.scrollTop = 0;
                            return;
                        }
                        var highlighted = rows[ctrl.activeIndex];
                        var posY = highlighted.offsetTop + highlighted.clientHeight - container.scrollTop;
                        var height = container.offsetHeight;

                        if (posY > height) {
                            container.scrollTop += posY - height;
                        } else if (posY < highlighted.clientHeight) {
                            container.scrollTop -= highlighted.clientHeight - posY;
                        }
                    }
                };

                $scope.$watch('$select.activeIndex', function () {
                    _scrollToActiveRow();
                });

                $scope.$watch('currentInstance', function (newValue) {
                    if (_.isEmpty(newValue)) {
                        ctrl.display = '';
                        ctrl.empty = true;
                    } else {
                        ctrl.display = newValue.data[targetField];
                        ctrl.empty = false;
                    }
                    //ctrl.open = false;
                });
            },
            scope: {
                currentInstance: '='
            },
            transclude: true,
            template:
            '<label class="control-label" for="@(page.model.name)-@field.name">{{$select.label}}</label>' +
            '<span ng-transclude></span>' +
            '<div class="ui-select-bootstrap dropdown" ng-class="{open: $select.open}">' +
            '<button type="button" class="btn btn-default dropdown-toggle form-control ui-select-match" focus-on="select-button-{{$select.id}}" data-ng-hide="$select.open" data-ng-click="$select.activate()">' +
            '<span ng-hide="$select.empty">{{$select.display}}</span><span ng-show="$select.empty" class="text-muted">Select...</span>' +
            '<i class="loading fa fa-spinner fa-spin" data-ng-show="$select.loading"></i><span class="caret"></span>' +
            '</button>' +
            '<button class="btn btn-xs btn-default ui-select-close" data-ng-show="$select.open" data-ng-click="$select.open = false"><i class="fa fa-times"></i></button>' +
            '<input class="form-control" data-ng-show="$select.open" focus-on="select-search-{{$select.id}}" data-ng-model="$select.filter" select-keydown>' +
            '<ul class="ui-select-choices ui-select-choices-content dropdown-menu" role="menu" ng-show="$select.items.length> 0">' +
            '<li class="ui-select-choices-row" data-ng-repeat="item in $select.items" ng-class="{active: $select.activeIndex===$index}" ng-mouseenter="$select.activeIndex = $index">' +
            '<a href="" data-ng-click="$select.choose(item)">{{item.data[$select.sourceField]}}</a></li>' +
            '</ul>' +
            '</div>'
        };
    })
    // TODO Consider moving this to a util module
    .directive('selectKeydown', function () {
        return function (scope, element) {
            element.bind('keydown keypress', function (event) {
                scope.$apply(function () {
                    var processed = scope.$select.keydown(event.which);
                    if (processed) {
                        event.preventDefault();
                    }
                });
            });
        };
    })
    // TODO Consider moving this to a util module
    .directive('focusOn', function () {
        return function (scope, elem, attr) {
            scope.$on('focusOn', function (e, name) {
                if (name === attr.focusOn) {
                    elem[0].focus();
                }
            });
        };
    })
    // TODO Consider moving this to a util module
    .factory('focus', function ($rootScope, $timeout) {
        return function (name) {
            $timeout(function () {
                $rootScope.$broadcast('focusOn', name);
            });
        };
    })
;

// Source: public/js/page/ui/textarea.js
angular.module('tantalim.desktop')
    .directive('tntTextarea', function () {
        return {
            restrict: 'E',
            controllerAs: '$textarea',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.placeholder = $attrs.placeholder;

                var fieldName = $attrs.name;
                ctrl.id = fieldName;
                ctrl.name = fieldName;

                ctrl.change = function () {
                    console.info('update' + fieldName);
                    $scope.currentInstance.update(fieldName);
                };
                ctrl.disabled = function () {
                    // This section still needs some work
                    if ($attrs.disabled === 'true') return true;
                    var notUpdateable = $attrs.updateable === 'false';
                    return $scope.state !== 'INSERTED' && notUpdateable;
                };
                ctrl.required = function () {
                    if ($attrs.required === 'true') return true;
                    return false;
                };
                ctrl.blur = function () {
                    if ($attrs.blurFunction) {
                        console.info('blur not implemented yet');
                        //field.blurFunction
                    }
                };
            },

            scope: {
                currentInstance: '='
            },
            transclude: true,
            template: '<span ng-transclude></span>' +
            '<label class="control-label" for="{{$textarea.id}}">{{$textarea.label}}</label>' +
            '<textarea class="form-control" id="{{$textarea.id}}" name="{{$textarea.name}}" ' +
            'data-ng-model="currentInstance.data[$textarea.name]" ng-focus=""' +
            'ng-change="$textarea.change()"' +
            'ng-blur="$textarea.blur()"' +
            'ng-disabled="$textarea.disabled()"' +
            'ng-required="$textarea.required()"' +
            'placeholder="{{$textarea.placeholder}}"></textarea>'
        };
    })
    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    })
;
// Source: public/js/page/ui/textbox.js
angular.module('tantalim.desktop')
    .directive('tntTextbox', function () {
        return {
            restrict: 'E',
            controllerAs: '$textbox',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.placeholder = $attrs.placeholder;

                var fieldName = $attrs.name;
                ctrl.id = fieldName;
                ctrl.name = fieldName;

                ctrl.change = function () {
                    console.info('update' + fieldName);
                    $scope.currentInstance.update(fieldName);
                };
                ctrl.disabled = function () {
                    // This section still needs some work
                    if ($attrs.disabled === 'true') return true;
                    var notUpdateable = $attrs.updateable === 'false';
                    return $scope.state !== 'INSERTED' && notUpdateable;
                };
                ctrl.required = function () {
                    if ($attrs.required === 'true') return true;
                    return false;
                };
                ctrl.blur = function () {
                    if ($attrs.blurFunction) {
                        console.info('blur not implemented yet');
                        //field.blurFunction
                    }
                };
            },

            scope: {
                currentInstance: '='
            },
            transclude: true,
            template: '<span ng-transclude></span>' +
            '<label class="control-label" for="{{$textbox.id}}">{{$textbox.label}}</label>' +
            '<input type="text" class="form-control" id="{{$textbox.id}}" name="{{$textbox.name}}"' +
            'data-ng-model="currentInstance.data[$textbox.name]" ng-focus=""' +
            'ng-change="$textbox.change()"' +
            'ng-blur="$textbox.blur()"' +
            'ng-disabled="$textbox.disabled()"' +
            'ng-required="$textbox.required()"' +
            'placeholder="{{$textbox.placeholder}}" select-on-click>'
        };
    })
    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    })
;
// Source: public/js/common/_app.js
/* global angular */

angular.module('tantalim.common', []);

// Source: public/js/common/global.js
/* global angular */

angular.module('tantalim.common')
    .factory('Global', [
        function () {
            return {
                pageName: window.pageName,
                modelName: window.pageName,
                user: window.user,
                authenticated: !!window.user
            };
        }
    ]);

// Source: public/js/common/guid.js
/* global angular */

angular.module('tantalim.common')
    .factory('GUID', function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    });

// Source: public/js/common/logger.js
/**
 * Logger.error("Error here");
 * Logger.log({
 *  message: "Or like this",
 *  type: Logger.TYPE.WARN,
 *  source: 'ModelCursor.js Line 123',
 *  details: 'Should fix it here.'
 * });
 */
angular.module('tantalim.common')
    .factory('Logger', [
        function () {

            var _self = {
                TYPE: {INFO: 'info', WARN: 'warn', ERROR: 'warn', DEBUG: 'debug'},
                history: [],
                log: function (content, messageType) {
                    content = normalizeContent(content);
                    content.type = messageType || _self.TYPE.INFO;

                    if (content.type === _self.TYPE.ERROR) {
                        _self._error = content.message
                    } else {
                        _self._status = content.message
                    }

                    _self.history.push(content);
                },
                info: function (content) {
                    _self.log(content);
                },
                warn: function (content) {
                    _self.log(content, _self.TYPE.WARN);
                },
                debug: function (content) {
                    _self.log(content, _self.TYPE.DEBUG);
                },
                error: function (content) {
                    _self.log(content, _self.TYPE.ERROR);
                },
                getStatus: function (status) {
                    return _self._status;
                },
                getError: function () {
                    return _self._error;
                }
            };

            function normalizeContent(content) {
                if (typeof content === 'string') {
                    return {message: content};
                } else return content;
            }

            return _self;
        }
    ]);
// Source: public/js/common/modelCursor.js
/* global _ */
/* global angular */

angular.module('tantalim.common')
    .factory('ModelCursor', ['$filter', '$log', 'GUID',
        function ($filter, $log, GUID) {
            var rootSet;
            var current;
            var modelMap;

            var clear = function () {
                rootSet = null;
                current = {};
                modelMap = {};
            };
            clear();

            var fillModelMap = function (model, parentName) {
                modelMap[model.name] = model;
                model.parent = parentName;
                _.forEach(model.children, function (childModel) {
                    fillModelMap(childModel, model.name);
                });
            };

            var STATE = {
                NO_CHANGE: 'NO_CHANGE',
                DELETED: 'DELETED',
                INSERTED: 'INSERTED',
                UPDATED: 'UPDATED',
                CHILD_UPDATED: 'CHILD_UPDATED'
            };

            /**
             *
             * @param model
             * @param row
             * @param nodeSet
             */
            var SmartNodeInstance = function (model, row, nodeSet) {
                //$log.debug('Adding SmartNodeInstance id:%s for model `%s` onto set ', row.id, model.name, nodeSet);
                var defaults = {
                    _type: 'SmartNodeInstance',
                    /**
                     * Unique identifier for this instance
                     */
                    id: null,
                    /**
                     * The map of columns and values for this instance
                     */
                    data: {},
                    /**
                     * reference to the parent SmartNodeSet that contains this instance
                     */
                    nodeSet: null,
                    /**
                     * map of SmartNodeInstances representing the children of this node
                     */
                    childModels: {},
                    getChild: function(name) {
                        var childModel = this.childModels[name];
                        if (childModel === undefined) {
                            console.warn('Child model ' + name + ' doesn\'t exist.');
                        }
                        return childModel;
                    },
                    state: STATE.NO_CHANGE,

                    delete: function () {
                        this.state = STATE.DELETED;
                    },
                    isDirty: function() {
                        //console.info("Checking this.state" + this.state + " for " + this.id);
                        return this.state !== STATE.NO_CHANGE;
                    },
                    toggle: function (fieldName, required) {
                        var currentValue = this.data[fieldName];
                        var newValue = true;
                        if (currentValue === true) newValue = false;
                        if (currentValue === undefined) newValue = true;
                        if (currentValue === false) {
                            if (required) newValue = true;
                            else newValue = null;
                        }
                        console.info("Setting ", fieldName, newValue);
                        this.update(fieldName, newValue);
                    },
                    getValue: function (fieldName) {
                        //console.info('finding value for fieldName: ', fieldName, this.data);

                        if (this.data.hasOwnProperty(fieldName)) {
                            return this.data[fieldName];
                        }

                        if (this.nodeSet.parentInstance) {
                            return this.nodeSet.parentInstance.getValue(fieldName);
                        }

                        // We could consider checking child models first before dying
                        throw new Error('Cannot find field called ' + fieldName);
                    },
                    setValue: function () {

                    },
                    update: function (fieldName, newValue, force) {
                        console.info('update ' + fieldName + ' to ' + newValue);
                        force = force || false;
                        var field = modelMap[nodeSet.model.modelName].fields[fieldName];
                        if (!field) {
                            console.error("Failed to find field named " + fieldName + " in ", modelMap[nodeSet.model.modelName].fields);
                        }
                        if (!field.updateable && !force) {
                            return;
                        }
                        // TODO get field defaults to work
                        if (fieldName) {
                            if (fieldName === 'TableName' && newValue) {
                                this.data.TableSQL = 'app_' + this.data[fieldName].toLowerCase();
                            }
                            if (newValue !== undefined) {
                                this.data[fieldName] = newValue;
                            }
                        }
                        if (this.state === STATE.NO_CHANGE || this.state === STATE.CHILD_UPDATED) {
                            this.state = STATE.UPDATED;
                            this.updateParent();
                        }
                    },
                    updateParent: function () {
                        if (!this.nodeSet) return;
                        var parent = this.nodeSet.parentInstance;
                        if (parent && parent.state === STATE.NO_CHANGE) {
                            parent.state = STATE.CHILD_UPDATED;
                            parent.updateParent();
                        }

                    },
                    isFieldEditable: function() {
                        //.state !== "INSERTED" && !currentField.updateable

                        return true;
                    }
                };

                var newInstance = _.defaults(row, defaults);
                newInstance.nodeSet = nodeSet;

                function setFieldDefault(field, row) {
                    var defaultValue;

                    if (field.valueDefault !== null) {
                        console.info(field.name + field.valueDefault);

                        defaultValue = field.valueDefault;
                        switch (field.dataType) {
                            case "Boolean":
                                defaultValue = (defaultValue === 'true');
                                break;
                        }
                    }
                    if (field.fieldDefault !== null) {
                        defaultValue = row.getValue(field.fieldDefault);
                    }
                    if (field.functionDefault !== null) {
                        defaultValue = eval(field.functionDefault);
                    }
                    if (defaultValue !== undefined) {
                        $log.debug('defaulted ' + field.name + ' to ' + defaultValue + ' of type ' + typeof defaultValue);
                        row.data[field.name] = defaultValue;
                    }
                }

                if (row.id === null) {
                    //$log.debug('id is null, so assume record is newly inserted', row);
                    newInstance.state = STATE.INSERTED;
                    newInstance.id = GUID();
                    _.forEach(model.fields, function (field) {
                        setFieldDefault(field, row);
                    });
                }

                newInstance.addChildModel = function (childModelName, childDataSet) {
                    //$log.debug('addChildModel ', childModelName, childDataSet);
                    var smartSet = new SmartNodeSet(modelMap[childModelName], childDataSet, newInstance, nodeSet.depth + 1);
                    newInstance.childModels[childModelName] = smartSet;
                };

                _.forEach(model.children, function (childModel) {
                    if (row.children) {
                        newInstance.addChildModel(childModel.name, row.children[childModel.name]);
                    } else {
                        newInstance.addChildModel(childModel.name, []);
                    }
                });

                //$log.debug('Done creating newInstance');
                return newInstance;
            };

            /**
             *
             * @param model
             * @param data
             * @param parentInstance
             * @param depth
             */
            var SmartNodeSet = function (model, data, parentInstance, depth) {
                //$log.debug('Adding SmartNodeSet for ' + model.name + ' at depth ' + depth);
                var defaults = {
                    _type: 'SmartNodeSet',
                    model: {
                        /**
                         * Name of the model
                         */
                        modelName: null,
                        /**
                         * Reference to the parent instance if any
                         */
                        parentInstance: null,
                        /**
                         * String - name of column to sort by
                         * function - function to apply to row for sorting
                         */
                        orderBy: null,
                        /**
                         * Array of strings representing the name of each child model
                         */
                        childModels: []
                    },
                    /**
                     * The parent SmartNodeInstance of this SmartNodeSet
                     * null if this instance is root
                     */
                    parent: {
                        instance: null,
                        model: null
                    },
                    /**
                     * Array of SmartNodeInstances
                     */
                    rows: [],
                    /**
                     * Array of SmartNodeInstances
                     */
                    deleted: [],
                    depth: depth || 0, // Will probably remove level
                    index: -1,

                    sort: function (field, direction) {
                        this.rows = $filter('orderBy')(this.rows, 'data.' + field, direction);
                    },
                    sortReverse: function () {
                        this.sort(true);
                    },
                    moveTo: function (index) {
                        if (index < 0) {
                            return;
                        }
                        if (index >= this.rows.length) {
                            return;
                        }
                        this.index = index;
                        self.resetCurrents(this);
                    },
                    movePrevious: function () {
                        this.moveTo(this.index - 1);
                    },
                    moveNext: function () {
                        this.moveTo(this.index + 1);
                    },
                    hasPrevious: function () {
                        return this.index > 0;
                    },
                    hasNext: function () {
                        return this.index + 1 < this.rows.length;
                    },
                    findIndex: function (id) {
                        return _.findIndex(this.rows, function (row) {
                            return row.id === id;
                        });
                    },
                    find: function(matcher) {
                        return _.find(this.rows, matcher);
                    },
                    max: function(fieldName) {
                        var value = _.max(this.rows, function(row) {
                            return Number(row.data[fieldName]);
                        });
                        if (value) return Number(value.data[fieldName]);
                        else return undefined;
                    },
                    min: function(fieldName) {
                        var value = _.min(this.rows, function(row) {
                            return Number(row.data[fieldName]);
                        });
                        if (value) return Number(value.data[fieldName]);
                        else return undefined;
                    },
                    isDirty: function() {
                        if (this.deleted && this.deleted.length > 0) return true;

                        var dirtyRow = _.find(this.rows, function(row) {
                            return row.isDirty();
                        });
                        return !_.isEmpty(dirtyRow);
                    },
                    delete: function (index) {
                        // console.info('deleting on set with index =', index);
                        var row = this.rows[index];
                        if (row.state !== STATE.INSERTED) {
                            // Only delete previously saved records
                            this.deleted.push(row);
                            row.updateParent();
                        }
                        this.rows.splice(index, 1);
                        self.clearCurrentChildren(this.model.modelName);
                    },
                    deleteEnabled: function() {
                        return this.getInstance() !== null;
                    },
                    getInstance: function (index) {
                        if (!this.rows || this.rows.length === 0) {
                            this.index = -1;
                            return null;
                        }
                        if (this.index < 0) {
                            this.index = 0;
                        }
                        index = index || this.index || 0;
                        return this.rows[index];
                    },
                    reloadFromServer: function (newData) {
                        $log.debug('reloadFromServer with returned data', newData);
                        $log.debug('this set', this);

                        _.forEach(this.rows, function (row) {
                            var modifiedRow;
                            switch (row.state) {
                                case STATE.INSERTED:
                                    modifiedRow = _.find(newData, function (newRow) {
                                        return newRow.tempID === row.id;
                                    });
                                    $log.debug('matching inserted row', row, modifiedRow);
                                    if (modifiedRow) {
                                        row.state = STATE.NO_CHANGE;
                                        row.data = modifiedRow.data;
                                        row.id = modifiedRow.id;
                                    } else {
                                        console.error('Failed to find matching inserted row', row);
                                    }
                                    break;
                                case STATE.UPDATED:
                                case STATE.CHILD_UPDATED:
                                    modifiedRow = _.find(newData, function (newRow) {
                                        return newRow.id === row.id;
                                    });
                                    $log.debug('matching update or child_updated row', row, modifiedRow);
                                    if (modifiedRow) {
                                        row.state = STATE.NO_CHANGE;
                                        if (row.state === STATE.UPDATED) {
                                            // Don't bother replacing the data if it was just the child data updated
                                            row.data = modifiedRow.data;
                                        }
                                    } else {
                                        console.error('Failed to find matching updated row', row);
                                    }
                                    break;
                            }
                            if (row.childModels && modifiedRow && modifiedRow.children) {
                                //console.info(row.childModels);
                                //console.info(modifiedRow);
                                _.forEach(row.childModels, function (child, childName) {
                                    //console.info(childName);
                                    var childDataFromServer = modifiedRow.children[childName];
                                    if (childDataFromServer) {
                                        row.childModels[childName].reloadFromServer(childDataFromServer);
                                    }
                                });
                            }
                        });

                        this.deleted = [];
                    }
                };

                var newSet = _.defaults({}, defaults);
                newSet.model.modelName = model.name;
                newSet.model.orderBy = model.orderBy;
                newSet.parentInstance = parentInstance;
                newSet.insert = function (values) {
                    $log.debug('Inserting new instance with model');
                    var smartInstance = new SmartNodeInstance(model, {data: values || {}}, newSet);
                    newSet.rows.push(smartInstance);
                    newSet.index = newSet.rows.length - 1;
                    smartInstance.updateParent();
                    self.resetCurrents(newSet);
                    return smartInstance;
                };

                if (angular.isArray(data)) {
                    _.forEach(data, function (row) {
                        var smartInstance = new SmartNodeInstance(model, row, newSet);
                        newSet.rows.push(smartInstance);
                    });
                    self.resetCurrents(newSet);
                }

                return newSet;
            };

            var self = {
                root: rootSet,
                current: current,
                setRoot: function (model, data) {
                    $log.debug('Setting Root data');
                    $log.debug(model);
                    $log.debug(data);
                    clear();
                    self.current = current;
                    if (_.isEmpty(model)) {
                        console.warn("setRoot called with empty model, exiting");
                        return;
                    }
                    fillModelMap(model);
                    rootSet = new SmartNodeSet(model, data);
                    self.root = rootSet;
                    self.resetCurrents(rootSet);
                },
                getCurrentSet: function (modelName) {
                    if (!_.isEmpty(self.current) && !self.current[modelName]) {
                        //console.warn('getCurrentSet is empty', modelName);
                        //console.warn('current = ', self.current);
                    }
                    return self.current[modelName];
                },
                resetCurrents: function (thisSet) {
                    if (!thisSet || thisSet._type !== 'SmartNodeSet') {
                        throw new Error('resetCurrents() requires a SmartNodeSet but got', thisSet);
                    }

                    var modelName = thisSet.model.modelName;

                    var thisModel = modelMap[modelName];
                    self.clearCurrentChildren(thisModel);

                    self.current[modelName] = thisSet;

                    var nextInstance = thisSet.getInstance();

                    if (thisModel && thisModel.children) {
                        _.forEach(thisModel.children, function (childModel) {
                            if (nextInstance && nextInstance.childModels) {
                                var childSet = nextInstance.childModels[childModel.name];
                                if (childSet) {
                                    self.resetCurrents(childSet);
                                }
                            }
                        });
                    }
                },
                clearCurrentChildren: function (model) {
                    if (!model.children) {
                        return;
                    }
                    _.forEach(model.children, function (childModel) {
                        current[childModel.name] = null;
                        self.clearCurrentChildren(childModel);
                    });
                },
                dirty: function () {
                    if (!rootSet) return false;
                    return rootSet.isDirty();
                },
                toConsole: function () {
                    console.log('ModelCursor.rootSet', self.root);
                    console.log('ModelCursor.modelMap', modelMap);
                    console.log('ModelCursor.current', self.current);
                }
            };

            return self;
        }
    ]);
// Source: public/js/common/modelSaver.js
/* global _ */
/* global angular */

angular.module('tantalim.common')
    .factory('ModelSaver', ['$http', '$log',
        function ($http, $log) {
            var rootSet;

            var _self = {
                convertToDto: function (model, dataSet) {
                    var modelName = model.name;
                    //$log.debug('Starting convertToDto for model ' + modelName);
                    //$log.debug(model);
                    //$log.debug(dataSet);

                    var convertSmartNodeInstanceToInsert = function (instance) {
                        return {
                            state: instance.state,
                            tempID: instance.id,
                            data: instance.data
                        };
                    };

                    var convertSmartNodeInstanceToUpdate = function (instance) {
                        return {
                            state: instance.state,
                            id: instance.id,
                            data: instance.data
                        };
                    };

                    var convertSmartNodeInstanceToDelete = function (instance) {
                        return {
                            state: 'DELETED',
                            id: instance.id
                        };
                    };

                    var addChildrenDtoToRow = function (parentInstance, model, instance) {
                        var dirtyChildren = false;

                        parentInstance.children = {};

                        _.forEach(model.children, function (childModel) {
                            var childModelName = childModel.name;
                            var dtoRows = _self.convertToDto(childModel, instance.childModels[childModelName]);
                            if (dtoRows.length > 0) {
                                parentInstance.children[childModelName] = dtoRows;
                                dirtyChildren = true;
                            }
                        });

                        if (!dirtyChildren) {
                            delete parentInstance.children;
                        }
                    };

                    var dtoRows = [];
                    if (!dataSet) {
                        $log.debug('dataSet is empty so exit');
                        return dtoRows;
                    }
                    $log.debug(dataSet);

                    _.forEach(dataSet.rows, function (row) {
                        var dtoRow = {};

                        if (row.state === 'INSERTED') {
                            dtoRow = convertSmartNodeInstanceToInsert(row);
                        } else if (row.state === 'UPDATED') {
                            dtoRow = convertSmartNodeInstanceToUpdate(row);
                        } else if (row.state === 'CHILD_UPDATED') {
                            dtoRow = convertSmartNodeInstanceToUpdate(row);
                        } else {
                            dtoRow = null;
                        }
                        if (dtoRow) {
                            dtoRows.push(dtoRow);
                            addChildrenDtoToRow(dtoRow, model, row);
                        }
                    });
                    _.forEach(dataSet.deleted, function (row) {
                        var dtoRow = convertSmartNodeInstanceToDelete(row);
                        dtoRows.push(dtoRow);
                        addChildrenDtoToRow(dtoRow, model, row);
                    });

                    return dtoRows;
                },

                sendData: function (parentModelName, dto, success) {
                    $log.debug('sendData()...');
                    $log.debug(dto);

                    $http.post('/data/' + parentModelName, dto).
                        success(function (data, status) {
                            $log.debug('Returned success');
                            $log.debug(status);
                            if (status === 200) {
                                if (data.error) {
                                    success('Failed to save data ' + data.error.message);
                                } else {
                                    rootSet.reloadFromServer(data);
                                    success('');
                                }
                            } else {
                                success('Failed ' + status);
                                console.error(status);
                                console.error(data);
                            }
                        }).
                        error(function (data, status) {
                            if (status === 404) {
                                success('Server not found. Check your Internet connection and try again.');
                            } else {
                                success('Server returned an unknown ' + status + ' error');
                            }
                        });
                },

                save: function (model, _rootSet, success) {
                    rootSet = _rootSet;
                    $log.debug('Starting ModelSaver.save');
                    var dtoRows = _self.convertToDto(model, rootSet);
                    _self.sendData(model.name, dtoRows, success);
                }
            };
            return _self;
        }
    ]);
// Source: public/js/common/pageService.js
/* global angular */

angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        var self = {
            readModelData: function (modelName, filterString, pageNumber) {
                var url = '/data/' + modelName + '?';
                if (filterString) {
                    url += 'filter=' + filterString;
                }
                if (pageNumber) {
                    if (filterString) {
                        url += '&';
                    }
                    url += 'page=' + pageNumber;
                }
                return self.readUrl(url);
            },
            readUrl: function (url) {
                return $http.get(url);
            }
        };
        return self;
    });
