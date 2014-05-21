'use strict';
// Source: public/js/mobile/_app.js
angular.module('tantalim.mobile', ['tantalim.common', 'ngRoute', 'mobile-angular-ui', 'mobile-angular-ui.touch', 'mobile-angular-ui.scrollable']);

// Source: public/js/mobile/main.js
angular.module('tantalim.mobile')
    .config(['$routeProvider', function ($routeProvider) {
        var pageName = window.pageName;
        $routeProvider.
            when('/', {
                templateUrl: '/m/' + pageName + '/list'
            }).
            when('/detail/:subPage/:id', {
                templateUrl: '/m/' + pageName + '/list'
            }).
            when('/list/:subPage', {
                templateUrl: '/m/' + pageName + '/list'
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
            } else {
                $scope.currentPage = 'list-' + $routeParams.subPage;
            }
        }
        console.info($scope.currentPage);

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

            var rootSet = null;
            var current = {sets: {}, instances: {}};
            var modelMap = {};

            var fillModelMap = function (model) {
//                console.info('fillModelMap');
//                console.info(model);
                modelMap[model.data.modelName] = model;
                _.forEach(model.children, function (childModel) {
                    fillModelMap(childModel);
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
                        var childModelName = childModel.data.modelName;
                        var childSet = getNextSet(childModelName);
                        resetCurrents(childSet, childModelName);
                    });
                }
            };

            var SmartNodeInstance = function (model, row, nodeSet) {
                // $log.debug('Adding SmartNodeInstance for ' + model.data.modelName);
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
                    },
                    selectOption: function (row, copyFields) {
                        var _self = this;
                        _.forEach(copyFields, function (copyField) {
                            _self.data[copyField.to] = row.data[copyField.from];
                        });
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
                //$log.debug('Adding SmartNodeSet for ' + model.data.modelName);
                //$log.debug(model);
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
                    $log.debug('Setting Root data');
                    $log.debug(model);
                    $log.debug(data);
                    modelMap = {};
                    fillModelMap(model);
                    rootSet = new SmartNodeSet(model, data);
                    self.root = rootSet;
                    resetCurrents(rootSet);
                    self.current = current;
                },
                dirty: false,
                change: function (data) {
                    if (data.state === 'NO_CHANGE' || data.state === 'CHILD_UPDATED') {
                        data.state = 'UPDATED';
                        markParentOfThisInstanceChanged(data);
                        self.dirty = true;
                    }
                },
                action: {
                    insert: function (modelName) {
                        current.sets[modelName].insert();
                        self.dirty = true;
                    },
                    delete: function (modelName, index) {
                        current.sets[modelName].delete(index);
                        self.dirty = true;
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
                return $http.get('/data/' + modelName + '/q/' + query);
            },
            getMenu: function () {
                return $http.get('/menu/');
            }
        };
    });
