'use strict';

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