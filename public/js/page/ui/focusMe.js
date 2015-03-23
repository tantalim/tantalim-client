'use strict';
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
