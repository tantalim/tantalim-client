'use strict';
// Source: public/js/page/ui/checkbox.js
angular.module('tantalim.desktop')
    .directive('tntCheckbox', function () {
        return {
            restrict: 'E',
            controllerAs: '$checkbox',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.help = $attrs.help;

                var targetField = $attrs.targetField;
                var required = $attrs.required === 'true';
                ctrl.toggle = function () {
                    $scope.currentInstance.toggle(targetField, required);
                    setValue($scope.currentInstance);
                };

                function setValue(instance) {
                    if (instance) {
                        ctrl.value = instance.data[targetField];
                    } else {
                        ctrl.value = null;
                    }
                }

                $scope.$watch('currentInstance', setValue);
            },
            scope: {
                currentInstance: '='
            },

            transclude: true,
            template: '<div class="checkbox"><span ng-transclude></span>' +
            '<label class="control-label no-select" class="ui-checkbox" for="{{$checkbox.id}}" data-ng-click="$checkbox.toggle()">' +
            '<i data-ng-show="$checkbox.value === true" class="fa fa-lg fa-fw fa-check-square-o"></i>' +
            '<i data-ng-show="$checkbox.value === false" class="fa fa-lg fa-fw fa-square-o"></i>' +
            '<i data-ng-show="$checkbox.value === null || $checkbox.value === undefined" class="fa fa-lg fa-fw fa-square-o disabled"></i>' +
            ' {{$checkbox.label}} </label>' +
            '<span data-ng-show="$checkbox.help" class="help-block"><i class="fa fa-info-circle"></i> {{$checkbox.help}}</span>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/focusMe.js
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

// Source: public/js/page/ui/grid.js
angular.module('tantalim.desktop')
    .directive('tntGrid', function () {
        return {
            restrict: 'E',
            controllerAs: '$grid',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.help = $attrs.help;
                ctrl.id = '123';
                ctrl.width = 200;

                var targetField = $attrs.targetField;
                var required = $attrs.required === 'true';
                ctrl.toggle = function () {
                    $scope.currentInstance.toggle(targetField, required);
                    setValue($scope.currentInstance);
                };

                function setValue(instance) {
                    if (instance) {
                        ctrl.value = instance.data[targetField];
                    } else {
                        ctrl.value = null;
                    }
                }

                $scope.$watch('currentInstance', setValue);
            },
            transclude: true,
            template: '<div class="tnt-grid tnt-grid-{{$grid.id}}">' +
            '<style> .tnt-grid-{{$grid.id}} { width: {{$grid.width}}px; }</style>{{$grid.id}}' +
            '' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/help.js
angular.module('tantalim.desktop')
    .directive('tntHelp', function () {
        return {
            restrict: 'E',
            transclude: true,
            link: function (scope, elem, attrs) {
                scope.title = attrs.label ? 'Help for ' + attrs.label : '';
            },
            template: '<div class="tnt-links">' +
            '<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true"><i class="fa fa-question"></i></button>' +
            '<div role="menu" aria-labelledby="dropdownMenu1" class="panel panel-default dropdown-menu dropdown-menu-right">' +
            '<div class="panel-heading" data-ng-show="title"><h3 class="panel-title">{{title}} <span class="pull-right"><i class="fa fa-question"></i></span></h3></div>' +
            '<div class="panel-body" ng-transclude></div></div>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/link.js
angular.module('tantalim.desktop')
    .directive('tntLinks', function () {
        return {
            restrict: 'E',
            transclude: true,
            template: '<div class="dropdown tnt-links">' +
            '<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true">' +
            '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>' +
            '<ul class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1" ng-transclude></ul></div>'
        };
    })
    .directive('tntLink', function ($compile) {
        return {
            restrict: 'E',
            compile: function CompilingFunction() {
                return function LinkingFunction($scope, $element, $attrs) {
                    //$scope.link = {
                    //    label: $attrs.label,
                    //    target: $attrs.target,
                    //    filter: $attrs.filter,
                    //    field: $attrs.field
                    //};
                    var html ='<li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-ng-click="link(\'' +
                        $attrs.target + '\', \'' +
                        ($attrs.filter.replace(/'/g, '\\\'').replace(/"/g, '\\\'') || '') + '\', \'' +
                        ($attrs.section || '') + '\')">' +
                        $attrs.label + '</a></li>';
                    var e = $compile(html)($scope);
                    $element.replaceWith(e);
                };
            }
        };
    })
;

// Source: public/js/page/ui/section.js
angular.module('tantalim.desktop')
    .directive('tntSection', function () {
        return {
            restrict: 'E',
            controllerAs: '$section',
            controller: function ($scope, $attrs) {
                var ctrl = this;
                ctrl.id = $attrs.id;
                ctrl.title = $attrs.title;
                ctrl.current = $attrs.current;
            },
            transclude: true,
            template: '<div id="{{$section.id}}" class="tntSection childSection">' +
            '<h2>{{$section.title}}</h2>' +
            '<div data-ng-hide="hide{{$section.id}} || {{$section.current}}.getCurrentSet().rows.length">' +
            '<div ng-transclude></div>' +
            '</div>'
        };
    })
    .directive('tntForm', function () {
        return {
            restrict: 'E',
            controllerAs: '$form',
            controller: function ($scope, $attrs) {
                var ctrl = this;
                ctrl.id = $attrs.id;
            },
            transclude: true,
            template: '<div id="$section.id" class="tntSection childSection">' +
            '<div ng-transclude></div>' +
            '</div>'
        };
    })
;

// Source: public/js/page/ui/select.js
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
            transclude: true,
            template:
            '<label class="control-label" for="@(page.model.name)-@field.name">{{$select.label}}</label>' +
            '<span ng-transclude></span>' +
            '<div class="ui-select-bootstrap dropdown" ng-class="{open: $select.open}">' +
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
                    var processed = scope.$select.keydown(event.which);
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

// Source: public/js/page/ui/textarea.js
angular.module('tantalim.desktop')
    .directive('tntTextarea', function () {
        return {
            restrict: 'E',
            controllerAs: '$textarea',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.placeholder = $attrs.placeholder;

                var fieldName = $attrs.name;
                ctrl.id = fieldName;
                ctrl.name = fieldName;

                ctrl.change = function () {
                    console.info('update' + fieldName);
                    $scope.currentInstance.update(fieldName);
                };
                ctrl.disabled = function () {
                    // This section still needs some work
                    if ($attrs.disabled === 'true') return true;
                    var notUpdateable = $attrs.updateable === 'false';
                    return $scope.state !== 'INSERTED' && notUpdateable;
                };
                ctrl.required = function () {
                    if ($attrs.required === 'true') return true;
                    return false;
                };
                ctrl.blur = function () {
                    if ($attrs.blurFunction) {
                        console.info('blur not implemented yet');
                        //field.blurFunction
                    }
                };
            },

            scope: {
                currentInstance: '='
            },
            transclude: true,
            template: '<span ng-transclude></span>' +
            '<label class="control-label" for="{{$textarea.id}}">{{$textarea.label}}</label>' +
            '<textarea class="form-control" id="{{$textarea.id}}" name="{{$textarea.name}}" ' +
            'data-ng-model="currentInstance.data[$textarea.name]" ng-focus=""' +
            'ng-change="$textarea.change()"' +
            'ng-blur="$textarea.blur()"' +
            'ng-disabled="$textarea.disabled()"' +
            'ng-required="$textarea.required()"' +
            'placeholder="{{$textarea.placeholder}}"></textarea>'
        };
    })
    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    })
;
// Source: public/js/page/ui/textbox.js
angular.module('tantalim.desktop')
    .directive('tntTextbox', function () {
        return {
            restrict: 'E',
            controllerAs: '$textbox',
            controller: function ($scope, $attrs) {

                var ctrl = this;
                ctrl.value = null;
                ctrl.label = $attrs.label;
                ctrl.placeholder = $attrs.placeholder;

                var fieldName = $attrs.name;
                ctrl.id = fieldName;
                ctrl.name = fieldName;

                ctrl.change = function () {
                    console.info('update' + fieldName);
                    $scope.currentInstance.update(fieldName);
                };
                ctrl.disabled = function () {
                    // This section still needs some work
                    if ($attrs.disabled === 'true') return true;
                    var notUpdateable = $attrs.updateable === 'false';
                    return $scope.state !== 'INSERTED' && notUpdateable;
                };
                ctrl.required = function () {
                    if ($attrs.required === 'true') return true;
                    return false;
                };
                ctrl.blur = function () {
                    if ($attrs.blurFunction) {
                        console.info('blur not implemented yet');
                        //field.blurFunction
                    }
                };
            },

            scope: {
                currentInstance: '='
            },
            transclude: true,
            template: '<span ng-transclude></span>' +
            '<label class="control-label" for="{{$textbox.id}}">{{$textbox.label}}</label>' +
            '<input type="text" class="form-control" id="{{$textbox.id}}" name="{{$textbox.name}}"' +
            'data-ng-model="currentInstance.data[$textbox.name]" ng-focus=""' +
            'ng-change="$textbox.change()"' +
            'ng-blur="$textbox.blur()"' +
            'ng-disabled="$textbox.disabled()"' +
            'ng-required="$textbox.required()"' +
            'placeholder="{{$textbox.placeholder}}" select-on-click>'
        };
    })
    .directive('selectOnClick', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.on('click', function () {
                    this.select();
                });
            }
        };
    })
;