'use strict';

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
