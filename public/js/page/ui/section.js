'use strict';

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
