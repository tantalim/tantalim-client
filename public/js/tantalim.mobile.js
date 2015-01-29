'use strict';
// Source: public/js/mobile/_app.js
// Not sure if they were needed, but removed... 'mobile-angular-ui.touch', 'mobile-angular-ui.scrollable'
angular.module('tantalim.mobile', ['tantalim.common', 'ngRoute', 'mobile-angular-ui']);

// Source: public/js/mobile/main.js
angular.module('tantalim.mobile')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/m/' + pageName + '/list',
                controller: 'PageController'
            }).
            when('/detail/:subPage/:id', {
                templateUrl: '/m/' + pageName + '/detail',
                controller: 'PageController'
            }).
            when('/list/:subPage', {
                templateUrl: '/m/' + pageName + '/list',
                controller: 'PageController'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
    ])
;

// Source: public/js/mobile/pageController.js
angular.module('tantalim.mobile')
    .controller('PageController',
    function ($scope, $routeParams, Global, ModelData, ModelCursor, ModelSaver, PageService) {
        $scope.loading = true;
        if (ModelData.error) {
            $scope.serverStatus = '';
            $scope.serverError = ModelData.error;
            return;
        }

        function attachModelCursorToScope() {
            $scope.ModelCursor = ModelCursor;
            $scope.current = ModelCursor.current;
            $scope.action = ModelCursor.action;
        }

        if (!Global.pageLoaded) {
            console.info('Starting PageController');
            Global.pageLoaded = true;
            $scope.serverStatus = 'Loading...';
            $scope.serverError = '';
            PageService.readModelData(ModelData.page.modelName)
                .then(function (d) {
                    $scope.serverStatus = '';
                    $scope.loading = false;
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
        } else {
            attachModelCursorToScope();
            $scope.loading = false;
            $scope.serverStatus = '';
        }

        $scope.staticContent = ModelData.staticContent;
        $scope.currentModel = ModelData.currentModel;
        Global.modelName = $scope.currentModel;

        $scope.currentPage = 'list-' + ModelData.page.id;
        if ($routeParams.subPage) {
            if ($routeParams.id) {
                $scope.currentPage = 'detail-' + $routeParams.subPage;
                ModelCursor.action.choose($routeParams.subPage, $routeParams.id);
            } else {
                $scope.currentPage = 'list-' + $routeParams.subPage;
            }
        }

        $scope.isActive = function (menuItem) {
            return menuItem === Global.pageName;
        }

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

                    var DEFAULT_TYPE = {
                        CONSTANT: "constant",
                        FIELD: "field",
                        FXN: "fxn"
                    };

                    switch(field.fieldDefault.type) {
                        case DEFAULT_TYPE.FIELD:
                            row.data[field.fieldName] = getFieldValue(field.fieldDefault.value, row);
                            $log.debug('defaulted ' + field.fieldName + ' to ' + row.data[field.fieldName]);
                            return;
                        case DEFAULT_TYPE.FXN:
                            console.info('running fxn - NOT SUPPORTED YET');
                            row.data[field.fieldName] = field.fieldDefault.value;
                            return;
                        case DEFAULT_TYPE.CONSTANT:
                        default:
                            row.data[field.fieldName] = field.fieldDefault.value;
                            $log.debug('defaulted ' + field.fieldName + ' to ' + row.data[field.fieldName]);
                            return;
                    }
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

                newInstance.addChildModel = function(childModel, childDataSet) {
                    var modelName = childModel.data.modelName;
                    var smartSet = new SmartNodeSet(childModel, childDataSet, newInstance);
                    newInstance.childModels[modelName] = smartSet;
                };

                if (row.children) {
                    _.forEach(model.children, function(childModel) {
                        var modelName = childModel.data.modelName;
                        newInstance.addChildModel(childModel, row.children[modelName]);
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
                        parentInstance.addChildModel({
                            data: {modelName: modelName}
                        }, []);
                        resetCurrents(self.root);
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
                        var newInstance = self.getCurrentSet(modelName).insert();
                        self.dirty = true;
                        return newInstance;
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
                    $log.debug(dataSet);

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
