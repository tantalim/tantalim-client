'use strict';
// Source: public/js/page/_app.js
angular.module('tantalim.desktop', ['tantalim.common', 'ngRoute', 'ui.bootstrap', 'ngSanitize', 'tantalim.select']);

// Source: public/js/page/focusMe.js
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
                        pressed: e.shiftKey ? true : false
                    },
                    ctrl: {
                        wanted: false,
                        pressed: e.ctrlKey ? true : false
                    },
                    alt: {
                        wanted: false,
                        pressed: e.altKey ? true : false
                    },
                    meta: { //Meta is Mac specific
                        wanted: false,
                        pressed: e.metaKey ? true : false
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

// Source: public/js/page/pageCursor.js
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log, ModelCursor, keyboardManager) {
        $log.debug('Starting PageCursor');

        var cursor = {
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: [],
            getSection: function (sectionName, level) {
                if (!cursor.sections[level] || !cursor.sections[level][sectionName]) {
                    $log.info('cursor.sections[level][sectionName] has not been created yet');
                    return;
                }
                return cursor.sections[level][sectionName];
            },
            toConsole: function () {
                console.log('PageCursor.current', cursor.current);
                console.log('PageCursor.sections', cursor.sections);
            }
        };

        var VIEWMODE = {FORM: "form", TABLE: "table"};

        var SmartSection = function (pageSection, level) {
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode,
                model: pageSection.model,
                fields: pageSection.fields,
                toggleViewMode: function () {
                    if (self.viewMode === VIEWMODE.FORM) {
                        self.viewMode = VIEWMODE.TABLE;
                    } else {
                        var currentSet = self.getCurrentSet();
                        currentSet.selectedRows.end = currentSet.selectedRows.start;
                        self.viewMode = VIEWMODE.FORM;
                    }
                },
                focus: function() {
                    cursor.current = self;
                },
                level: level || 0,
                getCurrentSet: function () {
                    return ModelCursor.getCurrentSet(self.model.name, self.level);
                }
            };

            if (!cursor.sections[self.level]) {
                cursor.sections[self.level] = {};
            }
            cursor.sections[self.level][pageSection.name] = self;
            _.forEach(pageSection.sections, function (section) {
                // Maybe we should only increase level if the lower section has it's own model
                new SmartSection(section, self.level + 1);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor', p);
            _.forEach(p.sections, function (section) {
                new SmartSection(section);
            });
        };


        function setupHotKeys() {
            keyboardManager.bind('up', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.movePrevious();
                }
            });
            keyboardManager.bind('tab', function () {
                if ($scope.currentSet) {

                    //PageCursor
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

        }


        return cursor;
    }
);

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
            var clipboard;
            var editCell;

            var clear = function () {
                rootSet = null;
                current = []; // {sets: {}, gridSelection: {}, editing: {}}
                modelMap = {};
                clipboard = {};
                editCell = {};
            };
            clear();

            var MOUSE = {
                LEFT: 1,
                RIGHT: 3
            };

            var fillModelMap = function (model, parentName) {
                modelMap[model.name] = model;
                model.parent = parentName;
                _.forEach(model.children, function (childModel) {
                    fillModelMap(childModel, model.name);
                });
            };

            var getCurrentSet = function (modelName, level) {
                level = level || 0;
                if (!current[level]) {
                    current[level] = {};
                }
                var currentLevel = current[level];
                if (currentLevel[modelName] === undefined && modelMap[modelName]) {
                    $log.debug('current set for %s hasn\'t been created yet, creating now.', modelName);
                    var parentName = modelMap[modelName].parent;
                    // TODO fix this part here
                    var parentInstance = currentLevel.instances[parentName];
                    parentInstance.addChildModel(modelName);
                    resetCurrents(self.root);
                }
                return currentLevel[modelName];
            };

            var resetCurrents = function (value, modelName, level) {
                if (!modelName && value) {
                    modelName = value.model.modelName;
                }
                level = level || 0;
                if (!current[level]) {
                    current[level] = {};
                }
                var currentLevel = current[level];

                var thisModel = modelMap[modelName];

                currentLevel[modelName] = value;
                // Remove all levels child "higher" than this one
                for(var i = current.length; i > level; i--) {
                    delete current[i];
                }

                var nextInstance = value.getInstance();

                if (thisModel && thisModel.children) {
                    _.forEach(thisModel.children, function (childModel) {
                        if (nextInstance && nextInstance.childModels) {
                            var childSet = nextInstance.childModels[modelName];
                            if (childSet) {
                                resetCurrents(childSet, childModel.name, level + 1);
                            }
                        }
                    });
                }
            };

            /**
             *
             * @param model
             * @param row
             * @param nodeSet
             */
            var SmartNodeInstance = function (model, row, nodeSet) {
                $log.debug('Adding SmartNodeInstance id:%s for model `%s` onto set ', row.id, model.name, nodeSet);
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
                    /**
                     * NO_CHANGE, DELETED, INSERTED, UPDATED
                     */
                    state: 'NO_CHANGE',

                    delete: function () {
                        this.state = 'DELETED';
                    },
                    isDirty: function() {
                        //console.info("Checking this.state" + this.state + " for " + this.id);
                        return this.state !== 'NO_CHANGE';
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
                        console.info('finding value for fieldName: ', fieldName, this.data);

                        if (this.data.hasOwnProperty(fieldName)) {
                            return this.data[fieldName];
                        }

                        if (this.nodeSet.parentInstance) {
                            return this.nodeSet.parentInstance.getValue(fieldName);
                        }

                        // We could consider checking child models first before dying
                        throw new Error('Cannot find field called ' + fieldName);
                    },
                    update: function (fieldName, newValue, oldValue) {
                        var field = modelMap[nodeSet.model.modelName].fields[fieldName];
                        if (!field) {
                            console.error("Failed to find field named " + fieldName + " in ", modelMap[nodeSet.model.modelName].fields);
                        }
                        if (!field.updateable) {
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
                        if (this.state === 'NO_CHANGE' || this.state === 'CHILD_UPDATED') {
                            this.state = 'UPDATED';
                            this.updateParent();
                        }
                    },
                    updateParent: function () {
                        if (!this.nodeSet) return;
                        console.info(this);
                        var parent = this.nodeSet.parentInstance;
                        if (parent && parent.state === 'NO_CHANGE') {
                            parent.state = 'CHILD_UPDATED';
                            parent.updateParent();
                        }

                    }
                };

                var newInstance = _.defaults(row, defaults);
                newInstance.nodeSet = nodeSet;

                function setFieldDefault(field, row) {
                    if (!field.fieldDefault) {
                        return;
                    }
                    $log.debug('Defaulting field ', field);

                    var DEFAULT_TYPE = {
                        CONSTANT: "Constant",
                        FIELD: "Field",
                        FXN: "Fxn"
                    };

                    switch (field.fieldDefault.type) {
                        case DEFAULT_TYPE.FIELD:
                            row.data[field.name] = row.getValue(field.fieldDefault.value);
                            break;
                        case DEFAULT_TYPE.FXN:
                            row.data[field.name] = eval(field.fieldDefault.value);
                            break;
                        case DEFAULT_TYPE.CONSTANT:
                            var value = field.fieldDefault.value
                            switch (field.dataType) {
                                case "Boolean":
                                    value = (value === 'true');
                                    break;
                            }
                            row.data[field.name] = value;
                            break;
                        default:
                            console.error("Failed to match fieldDefault.type on ", field);
                    }
                    $log.debug('defaulted ' + field.name + ' to ' + row.data[field.name] + ' of type ' + typeof row.data[field.name]);
                }

                if (row.id === null) {
                    $log.debug('id is null, so assume record is newly inserted', row);
                    newInstance.state = 'INSERTED';
                    newInstance.id = GUID();
                    _.forEach(model.fields, function (field) {
                        setFieldDefault(field, row);
                    });
                }

                newInstance.addChildModel = function (childModelName, childDataSet) {
                    var smartSet = new SmartNodeSet(modelMap[childModelName], childDataSet, newInstance, nodeSet.depth + 1);
                    newInstance.childModels[childModelName] = smartSet;
                };

                if (row.children) {
                    _.forEach(model.children, function (childModel) {
                        newInstance.addChildModel(childModel.name, row.children[childModel.name]);
                    });
                }

                $log.debug('Done creating newInstance');
                return newInstance;
            };

            /**
             *
             * @param model
             * @param data
             * @param parentInstance
             */
            var SmartNodeSet = function (model, data, parentInstance, depth) {
                $log.debug('Adding SmartNodeSet for ' + model.name + ' at depth ' + depth);
                //console.debug(model);
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
                    selectedRows: {},
                    selectedColumns: {},
                    /**
                     * Array of SmartNodeInstances
                     */
                    rows: [],
                    /**
                     * Array of SmartNodeInstances
                     */
                    deleted: [],
                    depth: depth || 0,

                    sort: function (reverse) {
                        var orderBy = this.model.orderBy;
                        if (angular.isString(orderBy)) {
                            orderBy = 'data.' + orderBy;
                        }
                        this.rows = $filter('orderBy')(this.rows, orderBy, reverse);
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
                        this.selectedRows.start = index;
                        this.selectedRows.end = index;
                        resetCurrents(this);
                    },
                    moveNext: function () {
                        this.moveTo(this.selectedRows.start + 1);
                    },
                    movePrevious: function () {
                        this.moveTo(this.selectedRows.start - 1);
                    },
                    moveToBottom: function () {
                        this.moveTo(this.rows.length - 1);
                    },
                    mousedown: function (row, column) {
                        if (event.which === MOUSE.LEFT) {
                            if (this.cellIsEditing(row, column)) {
                                return;
                            } else {
                                editCell = {};
                            }
                            this.selectedRows = {
                                selecting: true,
                                start: row,
                                end: row
                            };
                            this.selectedColumns = {};
                            this.mouseover(row, column);
                        }
                    },
                    mouseover: function (row, column) {
                        if (event.which === MOUSE.LEFT) {
                            if (this.cellIsEditing(row, column)) {
                                return;
                            }
                            if (this.selectedRows.selecting) {
                                this.selectedRows.end = row;
                                this.selectedColumns[column] = true;
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    },
                    mouseup: function () {
                        if (event.which === MOUSE.LEFT) {
                            this.selectedRows.selecting = false;
                            this.fixSelectedRows();
                        }
                    },
                    dblclick: function (row, column) {
                        if (event.which !== MOUSE.LEFT) {
                            return;
                        }
                        var currentField = modelMap[this.model.modelName].fields[column];
                        var currentInstance = this.getInstance(row);
                        if (currentInstance.state !== "INSERTED" && !currentField.updateable) {
                            return;
                        }
                        editCell = {
                            model: this.model.modelName,
                            level: this.depth,
                            row: row,
                            column: column
                        };
                        //currentFocus = this.model.modelName + "_" + this.depth + "_" + column + "_" + row;
                    },
                    cellIsSelected: function (row, column) {
                        var start = this.selectedRows.start;
                        var end = this.selectedRows.end;
                        if (start > end) {
                            start = end;
                            end = this.selectedRows.start;
                        }

                        return start <= row
                            && end >= row
                            && this.selectedColumns[column] // get all columns in between
                            ;
                    },
                    cellIsEditing: function (row, column) {
                        return editCell.model === this.model.modelName
                            && editCell.level === this.depth
                            && this.selectedRows.start === row
                            && editCell.column === column;
                    },
                    focus: function(row, column) {
                        if (this.cellIsEditing(row, column)) {
                            return true;
                            //return currentFocus === this.model.modelName + "_" + this.depth + "_" + column + "_" + row;
                        }
                        return false;
                    },
                    findIndex: function (id) {
                        return _.findIndex(this.rows, function (row) {
                            return row.id === id;
                        });
                    },
                    fixSelectedRows: function() {
                        function variableBetween(current, low, high) {
                            if (current === undefined) return low;
                            if (current < low) return low;
                            if (current > high) return high;
                            return current;
                        }

                        if (this.rows.length === 0) {
                            this.selectedRows = {start: -1, end: -1};
                        } else {
                            var maxEnd = this.rows.length - 1;
                            this.selectedRows.start = variableBetween(this.selectedRows.start, 0, maxEnd);
                            this.selectedRows.end = variableBetween(this.selectedRows.end, 0, maxEnd);
                            if (this.selectedRows.end < this.selectedRows.start) {
                                // Swap start and end since end should always be >= start
                                var temp = this.selectedRows.end;
                                this.selectedRows.end = this.selectedRows.start;
                                this.selectedRows.start = temp;
                            }
                        }
                        resetCurrents(this);
                    },
                    isDirty: function() {
                        if (this.deleted && this.deleted.length > 0) return true;

                        var dirtyRow = _.find(this.rows, function(row) {
                            return row.isDirty();
                        });
                        return !_.isEmpty(dirtyRow);
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
                    deleteEnabled: function() {
                        return this.getInstance() !== null;
                    },
                    getInstance: function (index) {
                        if (!index) {
                            index = this.selectedRows.start;
                        }
                        if (!index || index < 0) {
                            index = 0;
                        }
                        if (!this.rows || this.rows.length === 0) {
                            return null;
                        }
                        return this.rows[index];
                    },
                    getSelectedRows: function () {
                        return _.slice(this.rows, this.selectedRows.start, this.selectedRows.end);
                    },
                    reloadFromServer: function (newData) {
                        $log.debug('reloadFromServer');
                        $log.debug(newData);
                        $log.debug(this);

                        _.forEach(this.rows, function (row) {
                            var modifiedRow;
                            switch (row.state) {
                                case 'INSERTED':
                                    $log.debug(row);
                                    modifiedRow = _.find(newData, function (newRow) {
                                        return newRow.tempID === row.id;
                                    });
                                    if (modifiedRow) {
                                        row.state = 'NO_CHANGE';
                                        row.data = modifiedRow.data;
                                        row.id = modifiedRow.id;
                                    } else {
                                        console.error('Failed to find matching inserted row', row);
                                    }
                                    break;
                                case 'UPDATED':
                                    $log.debug(row);
                                    modifiedRow = _.find(newData, function (newRow) {
                                        return newRow.id === row.id;
                                    });
                                    if (modifiedRow) {
                                        row.state = 'NO_CHANGE';
                                        row.data = modifiedRow.data;
                                    } else {
                                        console.error('Failed to find matching updated row', row);
                                    }
                                    break;
                            }
                        });

                        this.deleted.length = 0;
                    }
                };

                var newSet = _.defaults({}, defaults);
                newSet.model.modelName = model.name;
                newSet.model.orderBy = model.orderBy;
                newSet.parentInstance = parentInstance;
                newSet.insert = function () {
                    $log.debug('Inserting new instance with model')
                    var smartInstance = new SmartNodeInstance(model, {}, newSet);
                    newSet.rows.push(smartInstance);
                    newSet.moveToBottom();
                    smartInstance.updateParent();
                    return smartInstance;
                };

                if (angular.isArray(data)) {
                    _.forEach(data, function (row) {
                        var smartInstance = new SmartNodeInstance(model, row, newSet);
                        newSet.rows.push(smartInstance);
                    });
                    newSet.fixSelectedRows();
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
                    if (_.isEmpty(model)) {
                        console.warn("setRoot called with empty model, exiting");
                        return;
                    }
                    fillModelMap(model);
                    rootSet = new SmartNodeSet(model, data);
                    self.root = rootSet;
                    resetCurrents(rootSet);
                    self.current = current;
                    //console.log('setRoot done: current=', current);
                },
                getCurrentSet: getCurrentSet,
                editCell: function() { return editCell },
                dirty: function () {
                    if (!rootSet) return false;
                    return rootSet.isDirty();
                },
                toConsole: function () {
                    console.log('ModelCursor.rootSet', self.root);
                    console.log('ModelCursor.modelMap', modelMap);
                    console.log('ModelCursor.current', self.current);
                },
                action: {
                    escape: function () {
                        editCell = {};
                    },
                    copy: function () {
                        if (current.gridSelection) {
                            clipboard = _.cloneDeep(current.gridSelection);
                        }
                    },
                    paste: function () {
                        if (clipboard && current.gridSelection) {
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
                    }
                }
            };

            function getRows(clipboard, minRows) {
                var copyStart = clipboard.rows.start;
                var copyEnd = 1 + clipboard.rows.end;
                if (minRows > copyEnd - copyStart) copyEnd = copyStart + minRows;
                var from = getCurrentSet(clipboard.model, level).rows;
                return _.slice(from, copyStart, copyEnd);
            }

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
        return {
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
                return $http.get(url);
            }
        };
    });
