'use strict';
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