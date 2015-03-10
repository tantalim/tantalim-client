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
    function ($scope, $log, $location, PageDefinition, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager, $window) {
        $scope.showLoadingScreen = true;
        //if (PageDefinition.error) {
        //    console.error('Error retrieving PageDefinition: ', PageDefinition.error);
        //    $scope.serverStatus = '';
        //    $scope.serverError = PageDefinition.error;
        //    if (PageDefinition.message) {
        //        $scope.serverError += ': ' + PageDefinition.message;
        //    }
        //    return;
        //}
        //if (!PageDefinition.page.model) {
        //    $scope.serverError = PageDefinition.page.name + ' page does not have a model defined.';
        //    return;
        //}

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

            PageService.readModelData(PageDefinition.page.model.name, searchController.filter(), searchController.page())
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
                    ModelCursor.setRoot(PageDefinition.page.model, d.data.rows);

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

        (function addFormMethodsToScope(){
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
                ModelSaver.save(PageDefinition.page.model, ModelCursor.root, function (error) {
                    $scope.serverStatus = '';
                    $scope.serverError = error;
                });
            };
        })();

        (function initializeSearchPage() {
            $scope.filterValues = {};
            $scope.filterComparators = {};

            angular.forEach(PageDefinition.page.model.fields, function (field) {
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
                        filterString += fieldName + ' ' + filterComparators[fieldName] + ' ' + value;
                    }
                });

                $scope.filterString = filterString;
            };

            $scope.filterString = '';
        })();

        $scope.link = function(targetPage, filter, modelName) {
            var data = ModelCursor.current.instances[modelName];
            _.forEach(data.data, function(value, key) {
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
    .factory('PageCursor', function ($log) {
        $log.debug('Starting PageCursor');

        var cursor = {
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: {},
            toConsole: function() {
                console.log('PageCursor.current', cursor.current);
                console.log('PageCursor.sections', cursor.sections);
            }
        };

        var SmartSection = function (pageSection) {
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode
            };
            cursor.sections[pageSection.name] = self;

            _.forEach(pageSection.children, function (child) {
                new SmartSection(child);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor');
            new SmartSection(p);
        };

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
 * Logger.log(Message({});
 */
angular.module('tantalim.common')
    .factory('Logger', [
        function () {
            var messages = [];

            var _self = {
                Message: function (content) {
                    var defaults = {

                    };

                    // merge content and defaults
                    return this;
                },
                log: function (message) {
                    messages.push(message);
                }
            };
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

            var clear = function () {
                rootSet = null;
                current = {sets: {}, instances: {}, gridSelection: {}, editing: {}};
                modelMap = {};
                clipboard = {};
            };
            clear();

            var MOUSE = {
                LEFT: 1,
                RIGHT: 3
            };

            var fillModelMap = function (model, parentName) {
                modelMap[model.name] = model;
                model.parent = parentName; //
                _.forEach(model.children, function (childModel) {
                    fillModelMap(childModel, model.name);
                });
            };

            var resetCurrents = function (value, modelName) {
                if (!modelName && value) {
                    modelName = value.model.modelName;
                }
                var thisModel = modelMap[modelName];

                current.sets[modelName] = value;

                var nextInstance = null;
                if (value) {
                    nextInstance = value.getInstance();
                }
                current.instances[modelName] = nextInstance;

                if (thisModel && thisModel.children) {

                    var getNextSet = function (modelName) {
                        if (nextInstance && nextInstance.childModels) {
                            return nextInstance.childModels[modelName];
                        }
                        return null;
                    };

                    _.forEach(thisModel.children, function (childModel) {
                        var childModelName = childModel.name;
                        var childSet = getNextSet(childModelName);
                        resetCurrents(childSet, childModelName);
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
                    update: function (fieldName, newValue, oldValue) {
                        var field = modelMap[nodeSet.model.modelName].fields[fieldName];
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

                function getFieldValue(fieldName, fromInstance) {
                    if (!fromInstance.nodeSet.parentInstance) {
                        $log.error('Cannot find field called ' + fieldName);
                        return null;
                    }
                    // I might need to change this to hasProperty to detect nulls or empty values
                    if (fromInstance.nodeSet.parentInstance.data[fieldName]) {
                        return fromInstance.nodeSet.parentInstance.data[fieldName];
                    }
                    // Can't find field here, let's check from the parent
                    return getFieldValue(fieldName, fromInstance.nodeSet.parentInstance);
                }

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
                            row.data[field.name] = getFieldValue(field.fieldDefault.value, row);
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
                    var smartSet = new SmartNodeSet(modelMap[childModelName], childDataSet, newInstance);
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
            var SmartNodeSet = function (model, data, parentInstance) {
                $log.debug('Adding SmartNodeSet for ' + model.name);
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
                    currentIndex: -1,
                    /**
                     * Array of SmartNodeInstances
                     */
                    rows: [],
                    /**
                     * Array of SmartNodeInstances
                     */
                    deleted: [],

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
                        this.currentIndex = index;
                        resetCurrents(this);
                    },
                    moveNext: function () {
                        this.moveTo(this.currentIndex + 1);
                    },
                    movePrevious: function () {
                        this.moveTo(this.currentIndex - 1);
                    },
                    moveToTop: function () {
                        this.moveTo(0);
                    },
                    moveToBottom: function () {
                        this.moveTo(this.rows.length - 1);
                    },
                    findIndex: function (id) {
                        return _.findIndex(this.rows, function (row) {
                            return row.id === id;
                        });
                    },
                    isDirty: function() {
                        if (this.deleted && this.deleted.length > 0) return true;

                        var dirtyRow = _.find(this.rows, function(row) {
                            return row.isDirty();
                        });
                        return !_.isEmpty(dirtyRow);
                    },
                    delete: function (index) {
                        if (this.rows.length <= 0) {
                            return;
                        }
                        var rowID = this.getInstance(index).id;
                        var removed = _.remove(this.rows, function (row) {
                            return row.id === rowID;
                        });

                        removed = _.remove(removed, function (row) {
                            // Don't bother deleting newly inserted records
                            return row.state !== 'INSERTED';
                        });

                        if (removed && removed.length > 0) {
                            removed[0].updateParent();
                            this.deleted.push(removed[0]);
                        }
                        if (this.currentIndex >= this.rows.length) {
                            this.currentIndex = this.rows.length - 1;
                        }
                        resetCurrents(this);
                    },
                    getInstance: function (index) {
                        if (!index) {
                            index = this.currentIndex;
                        }
                        if (!index || index < 0) {
                            index = 0;
                        }
                        if (!this.rows || this.rows.length === 0) {
                            return null;
                        }
                        return this.rows[index];
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
                    if (newSet.rows.length) {
                        newSet.currentIndex = 0;
                    }
                }

                return newSet;
            };

            var self = {
                root: rootSet,
                current: current,
                setRoot: function (model, data) {
                    $log.debug('Setting Root data');
                    //$log.debug(model);
                    //$log.debug(data);
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
                getCurrentInstance: function (modelName) {
                    return current.instances[modelName];
                },
                getCurrentSet: function (modelName) {
                    if (current.sets[modelName] === undefined) {
                        $log.debug('current set for %s hasn\'t been created yet, creating now.', modelName);
                        var parentName = modelMap[modelName].parent;
                        var parentInstance = current.instances[parentName];
                        parentInstance.addChildModel(modelName);
                        resetCurrents(self.root);
                    }
                    return current.sets[modelName];
                },
                dirty: function () {
                    return rootSet.isDirty();
                },
                toConsole: function () {
                    console.log('ModelCursor.rootSet', self.root);
                    console.log('ModelCursor.modelMap', modelMap);
                    console.log('ModelCursor.current', self.current);
                },
                action: {
                    length: function (modelName) {
                        if (_.isEmpty(current.sets[modelName])) {
                            return 0;
                        }
                        return current.sets[modelName].rows.length;
                    },
                    insert: function (modelName) {
                        var newInstance = self.getCurrentSet(modelName).insert();
                        return newInstance;
                    },
                    delete: function (modelName, index) {
                        current.sets[modelName].delete(index);
                    },
                    deleteSelected: function (modelName) {
                        if (current.gridSelection.model === modelName) {
                            for (var row = current.gridSelection.rows.start; row <= current.gridSelection.rows.end; row++) {
                                current.sets[modelName].delete(current.gridSelection.rows.start);
                            }
                            if (current.sets[modelName].rows.length > 0) {
                                current.gridSelection.rows.end = current.gridSelection.rows.start;
                            } else {
                                current.gridSelection = {};
                            }
                        }
                    },
                    deleteEnabled: function (modelName) {
                        return current.instances[modelName] !== null;
                    },
                    choose: function (modelName, id) {
                        var index = current.sets[modelName].findIndex(id);
                        current.sets[modelName].moveTo(index);
                    },
                    select: function (modelName, index) {
                        current.sets[modelName].moveTo(index);
                    },
                    previous: function (modelName) {
                        current.sets[modelName].movePrevious();
                    },
                    next: function (modelName) {
                        current.sets[modelName].moveNext();
                    },
                    dblclick: function (modelName, row, column) {
                        if (event.which !== MOUSE.LEFT) {
                            return;
                        }
                        var currentField = modelMap[modelName].fields[column];
                        var currentInstance = current.sets[modelName].getInstance(row);
                        console.info(currentInstance);
                        console.info(currentField);
                        if (currentInstance.state !== "INSERTED" && !currentField.updateable) {
                            return;
                        }
                        current.editing = {};
                        current.editing[modelName] = {
                            row: row,
                            column: column
                        };
                        current.focus = modelName + "_" + column + "_" + row;
                    },
                    focus: function(modelName, row, column) {
                        if (self.action.cellIsEditing(modelName, row, column)) {
                            return current.focus === modelName + "_" + column + "_" + row;
                        }
                        return false;
                    },
                    cellIsEditing: function (modelName, row, column) {
                        //return true;
                        return current.editing[modelName]
                            && current.editing[modelName].row === row
                            && current.editing[modelName].column === column;
                    },
                    escape: function () {
                        current.editing = {};
                    },
                    mousedown: function (modelName, row, column) {
                        if (event.which === MOUSE.LEFT) {
                            if (self.action.cellIsEditing(modelName, row, column)) {
                                return;
                            } else {
                                current.editing = {};
                            }
                            current.gridSelection = {
                                selecting: true,
                                model: modelName,
                                rows: {
                                    start: row,
                                    end: row
                                },
                                columns: {}
                            };
                            self.action.mouseover(modelName, row, column);
                            self.action.select(modelName, row);
                        }
                    },
                    mouseover: function (modelName, row, column) {
                        if (event.which === MOUSE.LEFT) {
                            if (self.action.cellIsEditing(modelName, row, column)) {
                                return;
                            }
                            if (current.gridSelection.selecting) {
                                if (modelName === current.gridSelection.model) {
                                    current.gridSelection.rows.end = row;
                                    current.gridSelection.columns[column] = true;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                            }
                        }
                    },
                    mouseup: function (modelName, row, column) {
                        if (event.which === MOUSE.LEFT) {
                            current.gridSelection.selecting = false;
                        }
                    },
                    cellIsSelected: function (modelName, row, column) {
                        return current.gridSelection.model === modelName
                            && current.gridSelection.rows.start <= row
                            && current.gridSelection.rows.end >= row
                            && current.gridSelection.columns[column]
                            ;
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
                var from = current.sets[clipboard.model].rows;
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
