'use strict';

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
                ctrl.help = $attrs.help;

                var fieldName = $attrs.name;
                ctrl.id = fieldName;
                ctrl.name = fieldName;

                ctrl.change = function() {
                    $scope.currentInstance.update(fieldName);
                };
                ctrl.disabled = function () {
                    // This section still needs some work
                    if ($attrs.disabled === 'true') return true;
                    var notUpdateable = $attrs.updateable === 'false';
                    return $scope.state !== 'INSERTED' && notUpdateable;
                };

                //$scope.$watch('currentInstance', setValue);
            },

            scope: {
                currentInstance: '='
            },
            template: '<label class="control-label" for="{{$textbox.id}}">{{$textbox.label}}</label>' +
            '<input type="text" class="form-control" id="{{$textbox.id}}" name="{{$textbox.name}}"' +
            'data-ng-model="currentInstance.data[$textbox.name]" ng-focus=""' +
            'ng-change="$textbox.change()"' +
            'ng-disabled="$textbox.disabled()"' +
            'placeholder="{{$textbox.placeholder}}" select-on-click>' +
            '<span data-ng-show="$textbox.help" class="help-block">{{$textbox.help}}</span>' +
            '<ul><tntLink ng-repeat="member in collection" member="member"></tntLink></ul>'

            /**
             ng-change="SmartPage.getSection('@(page.name)', @depth).getCurrentSet().getInstance().update('@(field.name)')"
             @if(field.blurFunction.isDefined) {
                    ng-blur="@Html(field.blurFunction.get)"
             }
             @if(field.required) {
                    ng-required="SmartPage.getSection('@(page.name)', @depth).getCurrentSet().getInstance()"
             }
             >
             @for(link <- field.links) {
                    <i class="fa fa-link fa-rotate-90" data-ng-click=""></i>
                    <a href="" data-ng-click="link('@link.page.name', '@link.filter', '@page.model.name')">@link.page.title</a>
             }
             *
             */

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
    .directive('tntLink', function () {
        return {
            restrict: 'E',
            template: 'asdf'
        };
    })
;