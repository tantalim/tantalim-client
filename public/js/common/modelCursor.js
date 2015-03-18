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