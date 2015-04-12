'use strict';

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
