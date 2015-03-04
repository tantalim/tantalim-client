'use strict';

angular.module('tantalim.select', [])
    .directive('uiSelect', function () {
        return {
            restrict: 'E',
            controllerAs: '$select',
            controller: function ($scope, $timeout, $attrs, $element, $location, focus, PageService, ModelCursor) {

                var EMPTY_SEARCH = '';

                var ctrl = this;
                ctrl.empty = false;
                ctrl.open = false;
                ctrl.activeIndex = undefined;
                ctrl.items = undefined;

                var itemModel = $attrs.itemModel;
                var itemValue = $attrs.itemValue || "value";
                ctrl.itemValue = itemValue;
                var instanceModel = $attrs.instanceModel;
                var instanceKey = $attrs.instanceKey;
                var instanceValue = $attrs.instanceValue;
                var otherMappings = $attrs.otherMappings;
                if (otherMappings) {
                    otherMappings = $scope.$eval(otherMappings);
                }
                var itemWhere = $attrs.itemWhere;
                if (itemWhere) {
                    itemWhere = $scope.$eval(itemWhere);
                }
                var refresh = $attrs.refresh;
                ctrl.id = instanceValue;

                var openItems = function () {
                    ctrl.open = true;
                    var items = ctrl.items;
                    ctrl.activeIndex = undefined;
                    var current = _getCurrent();
                    if (current) {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].id === current.data[instanceKey]) {
                                ctrl.activeIndex = i;
                            }
                        }
                    }
                };

                ctrl.activate = function () {
                    var _promise = undefined;
                    if (ctrl.open) {
                        console.info("Wondering if this ever happens anymore...")
                        if (ctrl.loading) {
                            // TODO consider removing this if clause promise, we dont' really use it
                            $timeout.cancel(_promise);
                            ctrl.loading = false;
                        }
                        ctrl.open = false;
                    } else {
                        ctrl.filter = EMPTY_SEARCH;
                        var whereClause = _.map(itemWhere, function(whereDefinition) {
                            // This works but is ugly. We need a simpler way to get to the data
                            var whereValueModelName = "BuildTable";
                            var value = ModelCursor.current.instances[whereValueModelName].data[whereDefinition.valueField];
                            return whereDefinition.sourceField + ' ' + whereDefinition.operator + ' ' + value;
                        });
                        if (ctrl.items === undefined) {
                            ctrl.loading = true;
                            if (ctrl.filter) {
                                //whereClause.push({ctrl.filter});
                            }
                            _promise = PageService.readModelData(itemModel, whereClause).then(function (d) {
                                ctrl.loading = false;
                                if (d.status !== 200) {
                                    // TODO Need to figure out how to bubble up these error messages to global
                                    $scope.serverError = 'Failed to reach server. Try refreshing.';
                                    console.error(d);
                                    return;
                                }
                                if (d.data.error) {
                                    $scope.serverError = 'Error reading data from server: ' + d.data.error;
                                    console.error(d);
                                    return;
                                }
                                ctrl.items = d.data.rows;
                                openItems();
                            });
                        } else {
                            openItems();
                        }
                        focus("select-search-" + ctrl.id);
                    }
                };
                var _getCurrent = function () {
                    return ModelCursor.getCurrentInstance(instanceModel);
                };

                ctrl.choose = function (item) {
                    // TODO if current hasn't been added then add it first
                    var current = _getCurrent().data;
                    current[instanceValue] = item.data[itemValue];
                    ctrl.display = current[instanceValue];
                    if (instanceKey) {
                        current[instanceKey] = item.id;
                    }
                    if (otherMappings) {
                        _.forEach(otherMappings, function (mapping) {
                            current[mapping.target] = item.data[mapping.source];
                        });
                    }
                    ModelCursor.change(_getCurrent());
                    ctrl.open = false;
                    ctrl.empty = false;
                    focus("select-button-" + ctrl.id);
                };

                var Key = {
                    Enter: 13,
                    Tab: 9,
                    Up: 38,
                    Down: 40,
                    Escape: 27
                };

                ctrl.keydown = function (key, current) {
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
                            focus("select-button-" + ctrl.id);
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

                $scope.$watch('$select.activeIndex', function (newValue) {
                    _scrollToActiveRow();
                });

                $scope.$watch("current", function (newValue) {
                    if (_.isEmpty(newValue)) {
                        ctrl.display = "";
                        ctrl.empty = true;
                    } else {
                        ctrl.display = newValue[instanceValue];
                        ctrl.empty = false;
                    }
                    ctrl.open = false;
                });
            },
            scope: {
                current: "="
            },
            template: '<div class="ui-select-bootstrap dropdown" ng-class="{open: $select.open}" current="current">' +
            '<button type="button" class="btn btn-default dropdown-toggle form-control ui-select-match" focus-on="select-button-{{$select.id}}" data-ng-hide="$select.open" data-ng-click="$select.activate()">' +
            '<span ng-hide="$select.empty">{{$select.display}}</span><span ng-show="$select.empty" class="text-muted">Select...</span>' +
            '<i class="loading fa fa-spinner fa-spin" data-ng-show="$select.loading"></i><span class="caret"></span>' +
            '</button>' +
            '<input class="form-control" data-ng-show="$select.open" focus-on="select-search-{{$select.id}}" data-ng-model="$select.filter" select-keydown>' +
            '<ul class="ui-select-choices ui-select-choices-content dropdown-menu" role="menu" ng-show="$select.items.length> 0">' +
            '<li class="ui-select-choices-row" data-ng-repeat="item in $select.items | filter:$select.filter" ng-class="{active: $select.activeIndex===$index}" ng-mouseenter="$select.activeIndex = $index">' +
            '<a href="" data-ng-click="$select.choose(item)">{{item.data[$select.itemValue]}}</a></li>' +
            '</ul>' +
            '</div>'
        };
    })
    // TODO Consider moving this to a util module
    .directive('selectKeydown', function () {
        return function (scope, element) {
            element.bind("keydown keypress", function (event) {
                scope.$apply(function () {
                    var processed = scope.$select.keydown(event.which, scope.current);
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
        }
    })
;
