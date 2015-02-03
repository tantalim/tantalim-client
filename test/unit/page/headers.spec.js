'use strict';

(function () {
    describe('tantalim.desktop', function () {
        var service;

        beforeEach(module('tantalim.desktop'));

        describe('HeaderController', function () {
            var scope, controller;

            beforeEach(inject(function ($controller, $rootScope) {
                scope = $rootScope.$new();

                controller = $controller('HeaderController', {
                    $scope: scope
                });
            }));

            it('should expose some global scope', function () {
                expect(scope.global).toBeTruthy();
            });
        });

    });
})
    ();

/*
 https://egghead.io/
 http://www.wekeroad.com/2013/04/25/models-and-services-in-angular/
 http://joelhooks.com/blog/2013/04/24/modeling-data-and-state-in-your-angularjs-application/
 http://cliffmeyers.com/blog/2013/4/21/code-organization-angularjs-javascript
 http://stackoverflow.com/questions/15666048/angular-js-service-vs-provider-vs-factory
 */
