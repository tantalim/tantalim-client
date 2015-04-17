'use strict';
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
                    getField: function(fieldName) {
                        var model = modelMap[this.nodeSet.model.modelName];
                        return model.fields[fieldName];
                    },
                    getValue: function (fieldName) {
                        //console.info('finding value for fieldName: ', fieldName, this.data);

                        if (this.data.hasOwnProperty(fieldName)) {
                            return this.data[fieldName];
                        }

                        if (this.getField(fieldName)) {
                            // This model has the field but it's empty
                            return null;
                        }

                        if (this.nodeSet.parentInstance) {
                            return this.nodeSet.parentInstance.getValue(fieldName);
                        }

                        // We could consider checking child models first before dying
                        throw new Error('Cannot find field called ' + fieldName);
                    },
                    setValue: function (fieldName, newValue, force) {
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
                    update: function (fieldName, newValue, force) {
                        console.warn('update is deprecated. Use setValue');
                        this.setValue(fieldName, newValue, force);
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
                    isEmpty: function() {
                        return !(this.rows.length > 0);
                    },
                    max: function(fieldName, lowest) {
                        if (this.isEmpty()) {
                            return lowest;
                        }
                        var value = _.max(this.rows, function(row) {
                            return Number(row.data[fieldName]);
                        });
                        if (value) return Number(value.data[fieldName]);
                        else return lowest;
                    },
                    min: function(fieldName, highest) {
                        if (this.isEmpty()) {
                            return highest;
                        }
                        var value = _.min(this.rows, function(row) {
                            return Number(row.data[fieldName]);
                        });
                        if (value) return Number(value.data[fieldName]);
                        else return highest;
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