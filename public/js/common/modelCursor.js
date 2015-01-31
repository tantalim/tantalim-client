'use strict';
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
                //$log.debug('Adding SmartNodeInstance for ', model, row);
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
                    //$log.debug('id is null, so assume record is newly inserted', row);
                    newInstance.state = 'INSERTED';
                    newInstance.id = GUID();
                    _.forEach(model.fields, function (field) {
                        setFieldDefault(field, row);
                    });
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