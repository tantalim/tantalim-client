'use strict';

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
