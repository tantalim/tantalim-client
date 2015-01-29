'use strict';
// Source: public/js/page/_app.js
angular.module('tantalim.desktop', ['tantalim.common', 'ngRoute', 'ui.bootstrap', 'ngGrid', 'ngSanitize', 'tantalim.select']);

// Source: public/js/page/keyboardManager.js
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
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/p/:subPage', {
                templateUrl: '/page/' + pageName + '/html'
            }).
            when('/search', {
                templateUrl: '/page/' + pageName + '/search'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
    .controller('HeaderController', ['$scope', 'Global', 'PageService',
        function ($scope, Global, service) {
            $scope.global = Global;
            service.getMenu().then(function (d) {
                $scope.menu = d.data;
            });
        }])
    .controller('SearchController', ['$scope', '$location',
        function ($scope, $location) {
            var modelName = '{{model.modelName}}';
            $scope.submit = function () {
                $location.path('page/' + modelName);
            };
        }])

;

// Source: public/js/page/pageController.js
angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $routeParams, Global, ModelData, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        if (ModelData.error) {
            $scope.serverStatus = '';
            $scope.serverError = ModelData.error;
            return;
        }

        function attachModelCursorToScope() {
            $scope.ModelCursor = ModelCursor;
            $scope.current = ModelCursor.current;
            $scope.action = ModelCursor.action;
            $scope.serverStatus = null;
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

        if (!Global.pageLoaded) {
            Global.pageLoaded = true;
            $scope.serverStatus = 'Loading...';
            $scope.serverError = '';
            $scope.current = {};
            PageService.readModelData(ModelData.page.modelName)
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
                    ModelCursor.setRoot(ModelData.model, d.data);
                    attachModelCursorToScope();
                });
            PageCursor.setPage(ModelData.page);
        } else {
            attachModelCursorToScope();
        }

        if ($routeParams.subPage) {
            $scope.visibleView = $routeParams.subPage;
        } else {
            $scope.visibleView = ModelData.page.id;
        }
        $scope.changeSubPage = function (pageName) {
            $scope.visibleView = pageName;
        };

        $scope.PageCursor = PageCursor;
        $scope.staticContent = ModelData.staticContent;
        $scope.currentModel = ModelData.currentModel;
        Global.modelName = $scope.currentModel;

        $scope.rowChanged = function (thisInstance) {
            ModelCursor.change(thisInstance);
        };

        $scope.save = function () {
            $scope.serverStatus = 'Saving...';
            ModelSaver.save(ModelData.model, ModelCursor.root, function (status) {
                $scope.serverStatus = status;
                if (!status) {
                    ModelCursor.dirty = false;
                }
            });
        };
        keyboardManager.bind('ctrl+s', function () {
            $scope.save();
        });
    }
);
// Source: public/js/page/pageCursor.js
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log) {
        $log.debug('Starting PageCursor');

        var _stub = function () {
        };
        var self = {
            pages: {},
            views: {},
            current: null,
            visibleView: null,
            setPage: _stub,
            action: {
            }
        };

        self.setPage = function (p) {
            new SmartPage(p);
            new SmartView(p);
        };

        var SmartPage = function (page) {
            var thisPage = {
                id: page.id,
                viewMode: page.viewMode
            };
            self.pages[page.id] = thisPage;

            _.forEach(page.pages, function (childPage) {
                new SmartPage(childPage);
            });
        };
/*
        var gridOptions = function (view) {

            var getDataName = function (view) {
                return 'ModelCursor.current.sets.' + view.modelName + '.rows';
            };

            var getColumnDefs = function (fields) {
                return _.map(fields, function (field) {
                    return {
                        field: 'data.' + field.fieldName,
                        displayName: field.fieldLabel
                    };
                });
            };

            var selectedItems = [];

            var afterSelectionChange = function(rowItem) {
                if (selectedItems.length > 0) {
                    var currentSet = selectedItems[0].nodeSet;
                    currentSet.moveTo(rowItem.rowIndex);
                }
            };

            return {
                afterSelectionChange: afterSelectionChange,
//                enableSorting: false,
//                enableColumnReordering: true,
                enableColumnResize: true,
                enableCellEdit: true,
                enablePinning: true,
                enableHighlighting: true,
                showColumnMenu: true,
                groupsCollapsedByDefault: false,
                multiSelect: false,
//                keepLastSelected: false,
                selectedItems: selectedItems,
                pagingOptions: { pageSizes: [10, 100, 1000], pageSize: 10, totalServerItems: 55, currentPage: 1 },
                columnDefs: getColumnDefs(view.listFields),
                data: getDataName(view)
            };
        };
*/

        var SmartView = function (view) {
            var thisView = {
                id: view.id
            };
            // Removing ngGrid for now
            // gridOptions: gridOptions(view)

            self.views[view.id] = thisView;

            _.forEach(view.children, function (childView) {
                new SmartView(childView);
            });
            _.forEach(view.pages, function (childView) {
                new SmartView(childView);
            });
        };

        return self;
    }
);

// Source: public/js/common/_app.js
angular.module('tantalim.common', []);

// Source: public/js/common/global.js
angular.module('tantalim.common')
    .factory('Global', [
        function () {
            var _this = this;
            _this._data = {
                pageName: window.pageName,
                modelName: window.pageName,
                user: window.user,
                authenticated: !!window.user
            };

            return _this._data;
        }
    ]);

// Source: public/js/common/guid.js
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

// Source: public/js/common/modelCursor.js
/* global _ */

angular.module('tantalim.common')
    .factory('ModelCursor', ['$filter', '$log', 'GUID',
        function ($filter, $log, GUID) {
//            $log.debug = function () {
//                // Override and ignore log output for now
//                // TODO figure out how to set this in a smarter way
//            };

            var rootSet;
            var current;
            var modelMap;

            var clear = function() {
                rootSet = null;
                current = {sets: {}, instances: {}};
                modelMap = {};
            }
            clear();

            var fillModelMap = function (model, parentName) {
                if (model && model.data) {
                    //console.debug(model);
                    //console.debug(parentName);
                    var modelName = model.data.modelName;
                    modelMap[modelName] = model;
                    model.parent = parentName;
                    _.forEach(model.children, function (childModel) {
                        fillModelMap(childModel, modelName);
                    });
                }
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
                        var childModelName = childModel.data.modelName;
                        var childSet = getNextSet(childModelName);
                        resetCurrents(childSet, childModelName);
                    });
                }
            };

            var SmartNodeInstance = function (model, row, nodeSet) {
                //$log.debug('Adding SmartNodeInstance for ' + model.data.modelName);
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
                    update: function () {
                        if (this.state === 'NO_CHANGE') {
                            this.state = 'UPDATED';
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
                    if (field.fieldDefault.value) {
                        row.data[field.fieldName] = field.fieldDefault.value;
                        return;
                    }
                    if (field.fieldDefault.fromField) {
                        row.data[field.fieldName] = getFieldValue(field.fieldDefault.fromField, row);
                        return;
                    }
                    if (field.fieldDefault.fxn) {
                        console.info('running fxn');
                        row.data[field.fieldName] = field.fieldDefault.fxn;
                        return;
                    }
                    $log.debug('No valid default found');
                    $log.debug(field);
                }

                if (row.id === null) {
                    newInstance.state = 'INSERTED';
                    newInstance.id = GUID();
                    _.forEach(model.fields, function (field) {
                        setFieldDefault(field, row);
                    });
                    $log.debug(row);
                    return newInstance;
                }

                if (row.children) {
                    _.forEach(model.children, function (childModel) {
                        var modelName = childModel.data.modelName;
                        var childSet = row.children[modelName];
                        var smartSet = new SmartNodeSet(childModel, childSet, newInstance);
                        newInstance.childModels[modelName] = smartSet;
                    });
                }

                return newInstance;
            };

            var SmartNodeSet = function (model, data, parentInstance) {
                //console.debug('Adding SmartNodeSet for ' + model.data.modelName);
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
                        return _.findIndex(this.rows, function(row) {
                            return row.id == id;
                        });
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
                            markParentOfThisInstanceChanged(removed[0]);
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
                                        console.error('Failed to find matching inserted row');
                                        console.error(row);
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
                                        console.error('Failed to find matching updated row');
                                        console.error(row);
                                    }
                                    break;
                            }
                        });

                        this.deleted.length = 0;
                    }
                };

                var newSet = _.defaults({}, defaults);
                newSet.model.modelName = model.data.modelName;
                newSet.model.orderBy = model.orderBy;
                newSet.parentInstance = parentInstance;
                newSet.insert = function () {
                    var smartInstance = new SmartNodeInstance(model, {}, newSet);
                    newSet.rows.push(smartInstance);
                    newSet.moveToBottom();
                    markParentOfThisInstanceChanged(smartInstance);
                };

                if (angular.isArray(data)) {
                    _.forEach(data, function (row) {
                        var smartInstance = new SmartNodeInstance(model, row, newSet);
                        newSet.rows.push(smartInstance);
                    });
                    if (newSet.rows.length) {
                        newSet.currentIndex = 0;
                    }
                } else {
                    console.warn('SmartNodeSet expected data to be array but got the following:');
                    console.warn(data);
                }

                return newSet;
            };

            function markParentOfThisInstanceChanged(instance) {
                var parent = instance.nodeSet.parentInstance;
                if (parent && parent.state === 'NO_CHANGE') {
                    parent.state = 'CHILD_UPDATED';
                    markParentOfThisInstanceChanged(parent);
                }
            }

            var self = {
                root: rootSet,
                current: current,
                setRoot: function (model, data) {
                    //$log.debug('Setting Root data');
                    //$log.debug(model);
                    //$log.debug(data);
                    clear();
                    if (_.isEmpty(model)) {
                        //console.log("setRoot called with empty model, exiting");
                        return;
                    }
                    fillModelMap(model);
                    rootSet = new SmartNodeSet(model, data);
                    self.root = rootSet;
                    resetCurrents(rootSet);
                    self.current = current;
                },
                getCurrentInstance: function (modelName) {
                    return current.instances[modelName];
                },
                getCurrentSet: function (modelName) {
                    if (current.sets[modelName] === undefined) {
                        var parentName = modelMap[modelName].parent;
                        var parentInstance = current.instances[parentName];
                        var newSet = new SmartNodeSet(modelMap[modelName], [], parentInstance);
                        resetCurrents(newSet);
                    }
                    return current.sets[modelName];
                },
                dirty: false,
                change: function (instance) {
                    if (instance.state === 'NO_CHANGE' || instance.state === 'CHILD_UPDATED') {
                        instance.state = 'UPDATED';
                        markParentOfThisInstanceChanged(instance);
                        self.dirty = true;
                    }
                },
                action: {
                    insert: function (modelName) {
                        self.getCurrentSet(modelName).insert();
                        self.dirty = true;
                    },
                    delete: function (modelName, index) {
                        current.sets[modelName].delete(index);
                        self.dirty = true;
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
                    }
                }
            };
            return self;
        }
    ]);
// Source: public/js/common/modelSaver.js
/* global _ */

angular.module('tantalim.common')
    .factory('ModelSaver', ['$http', '$log',
        function ($http, $log) {
            var rootSet;

            var _self = {
                convertToDto: function (model, dataSet) {
                    var modelName = model.data.modelName;
                    $log.debug('Starting convertToDto for model ' + modelName);
                    $log.debug(model);

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
                            var childModelName = childModel.data.modelName;
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
                            if (status === 200) {
                                if (data.error) {
                                    success('Failed to save data ' + data.error);
                                } else {
                                    rootSet.reloadFromServer(data);
                                    success();
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
                            }
                            console.error(status);
                            console.error(data);
                        });
                },

                save: function (model, _rootSet, success) {
                    rootSet = _rootSet;
                    $log.debug('Starting ModelSaver.save');
                    var dtoRows = _self.convertToDto(model, rootSet);
                    _self.sendData(model.data.modelName, dtoRows, success);
                }
            };
            return _self;
        }
    ]);
// Source: public/js/common/pageService.js
angular.module('tantalim.common')
    .factory('PageService', function ($http) {
        return {
            readModelData: function (modelName) {
                return $http.get('/data/' + modelName);
            },
            queryModelData: function (modelName, query) {
                //console.info("queryModelData");
                //console.info(query);
                var url = '/data/' + modelName;
                if (angular.isArray(query)) {
                    url += "?"
                    _.forEach(query, function (clause) {
                        url += clause.field + clause.operator + clause.value + "&";
                    });
                } else if (query) {
                    url += '/q/' + query;
                }
                return $http.get(url);
            },
            getMenu: function () {
                return $http.get('/menu/');
            }
        };
    });
