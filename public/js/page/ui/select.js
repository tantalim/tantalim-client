'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .directive('tntSelect', function () {
        return {
            restrict: 'E',
            controllerAs: '$select',
            controller: function ($scope, $timeout, $attrs, $element, $location, focus, PageService) {

                var EMPTY_SEARCH = '';

                var ctrl = this;
                ctrl.empty = false;
                ctrl.open = false;
                ctrl.activeIndex = undefined;
                ctrl.items = undefined;

                ctrl.label = $attrs.label;
                var sourceField = $attrs.sourceField;
                ctrl.sourceField = $attrs.sourceField; // sourceField is referenced in the template so it has to be part of ctrl
                var targetId = $attrs.targetId;
                var targetField = $attrs.targetField;
                var otherMappings;
                if ($attrs.otherMappings) {
                    console.info('Eval ' + $attrs.otherMappings);
                    otherMappings = $scope.$eval($attrs.otherMappings);
                }
                var previousFilter = '';
                ctrl.id = targetField;

                var openItems = function () {
                    ctrl.open = true;
                    ctrl.activeIndex = undefined;
                    var currentInstance = $scope.currentInstance;
                    if (currentInstance) {
                        for (var i = 0; i < ctrl.items.length; i++) {
                            var item = ctrl.items[i];
                            if (targetId) {
                                if (item.id === currentInstance.data[targetId]) {
                                    ctrl.activeIndex = i;
                                }
                            } else {
                                if (item.data[sourceField] === currentInstance.data[targetField]) {
                                    ctrl.activeIndex = i;
                                }
                            }
                        }
                    }
                };

                ctrl.activate = function () {
                    var sourceItemText = $attrs.sourceItems;
                    if (sourceItemText) {
                        if (ctrl.items === undefined) {
                            ctrl.items = $scope.$eval(sourceItemText);
                        }
                        openItems();
                        return;
                    }

                    var sourceFilter = $attrs.sourceFilter;
                    if (sourceFilter) {
                        var pat = /\${(\w+)}/gi;
                        sourceFilter = sourceFilter.replace(pat, function (match, fieldName) {
                            var currentValue = $scope.currentInstance.getValue(fieldName);
                            if (currentValue === undefined) {
                                throw new Error('You must select ' + fieldName + ' first');
                            }
                            return currentValue;
                        });
                    }
                    if (ctrl.items === undefined || previousFilter !== sourceFilter) {
                        ctrl.loading = true;
                        ctrl.filter = EMPTY_SEARCH;
                        // TODO Support filtering the list if it's really long
                        //if (ctrl.filter) {
                        //    whereClause.push({ctrl.filter});
                        //}
                        console.info('readModelData where', sourceFilter);
                        PageService.readModelData($attrs.sourceModel, sourceFilter).then(function (d) {
                            ctrl.loading = false;
                            if (d.status !== 200) {
                                // TODO Need to figure out how to bubble up these error messages to global
                                // We should probably create a global Error Message handler
                                $scope.serverError = 'Failed to reach server. Try refreshing.';
                                console.error('Failed to reach server. Try refreshing.');
                                console.error(d);
                                return;
                            }
                            if (d.data.error) {
                                $scope.serverError = 'Error reading data from server: ' + d.data.error;
                                console.error('Error reading data from server:', d.data.error);
                                return;
                            }
                            ctrl.items = d.data.rows;
                            previousFilter = sourceFilter;
                            openItems();
                        });
                    } else {
                        openItems();
                    }
                    focus('select-search-' + ctrl.id);
                };

                ctrl.choose = function (item) {
                    var currentInstance = $scope.currentInstance;
                    currentInstance.update(targetField, item.data[sourceField]);
                    ctrl.display = currentInstance.data[targetField];
                    if (targetId) {
                        currentInstance.data[targetId] = item.id;
                    }

                    if (otherMappings) {
                        console.info('updating otherMappings ', otherMappings);
                        _.forEach(otherMappings, function (mapping) {
                            currentInstance.update(mapping.target, item.data[mapping.source]);
                        });
                    }
                    ctrl.open = false;
                    ctrl.empty = false;
                    focus('select-button-' + ctrl.id);
                };

                var Key = {
                    Enter: 13,
                    Tab: 9,
                    Up: 38,
                    Down: 40,
                    Escape: 27
                };

                ctrl.keydown = function (key) {
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
                            focus('select-button-' + ctrl.id);
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

                $scope.$watch('$select.activeIndex', function () {
                    _scrollToActiveRow();
                });

                $scope.$watch('currentInstance', function (newValue) {
                    if (_.isEmpty(newValue)) {
                        ctrl.display = '';
                        ctrl.empty = true;
                    } else {
                        ctrl.display = newValue.data[targetField];
                        ctrl.empty = false;
                    }
                    //ctrl.open = false;
                });
            },
            scope: {
                currentInstance: '='
            },
            template: '<label class="control-label" for="@(page.model.name)-@field.name">{{$select.label}}</label><div class="ui-select-bootstrap dropdown" ng-class="{open: $select.open}">' +
            '<button type="button" class="btn btn-default dropdown-toggle form-control ui-select-match" focus-on="select-button-{{$select.id}}" data-ng-hide="$select.open" data-ng-click="$select.activate()">' +
            '<span ng-hide="$select.empty">{{$select.display}}</span><span ng-show="$select.empty" class="text-muted">Select...</span>' +
            '<i class="loading fa fa-spinner fa-spin" data-ng-show="$select.loading"></i><span class="caret"></span>' +
            '</button>' +
            '<button class="btn btn-xs btn-default ui-select-close" data-ng-show="$select.open" data-ng-click="$select.open = false"><i class="fa fa-times"></i></button>' +
            '<input class="form-control" data-ng-show="$select.open" focus-on="select-search-{{$select.id}}" data-ng-model="$select.filter" select-keydown>' +
            '<ul class="ui-select-choices ui-select-choices-content dropdown-menu" role="menu" ng-show="$select.items.length> 0">' +
            '<li class="ui-select-choices-row" data-ng-repeat="item in $select.items" ng-class="{active: $select.activeIndex===$index}" ng-mouseenter="$select.activeIndex = $index">' +
            '<a href="" data-ng-click="$select.choose(item)">{{item.data[$select.sourceField]}}</a></li>' +
            '</ul>' +
            '</div>'
        };
    })
    // TODO Consider moving this to a util module
    .directive('selectKeydown', function () {
        return function (scope, element) {
            element.bind('keydown keypress', function (event) {
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
        };
    })
;
