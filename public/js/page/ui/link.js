'use strict';

angular.module('tantalim.desktop')
    .directive('tntLinks', function () {
        return {
            restrict: 'E',
            link: function() {

            },
            transclude: true,
            template: '<div class="dropdown tnt-links">' +
            '<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true"><i class="fa fa-link"></i></button>' +
            '<ul class="dropdown-menu dropdown-menu-right" role="menu" aria-labelledby="dropdownMenu1" ng-transclude></ul></div>'
        };
    })
    .directive('tntLink', function ($compile) {
        return {
            restrict: 'E',
            compile: function CompilingFunction() {
                return function LinkingFunction($scope, $element, $attrs) {
                    console.info('$attrs', $attrs);
                    //$scope.link = {
                    //    label: $attrs.label,
                    //    target: $attrs.target,
                    //    filter: $attrs.filter,
                    //    field: $attrs.field
                    //};
                    var html ='<li role="presentation"><a role="menuitem" tabindex="-1" href="#" data-ng-click="link(\'' +
                        $attrs.target + '\', \'' +
                        ($attrs.filter || '') + '\', \'' +
                        ($attrs.field || '') + '\')">' +
                        $attrs.label + '</a></li>';
                    var e = $compile(html)($scope);
                    $element.replaceWith(e);
                };
            }
        };
    })
;
