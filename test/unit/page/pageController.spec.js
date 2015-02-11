'use strict';

describe('PageController', function () {
    var scope,
        PageDefinitionMock,
        dataResponse,
        pageServiceMock = {
            readModelData: function () {
                return {
                    then: function (response) {
                        response(dataResponse);
                    }
                }
            }
        };

    beforeEach(module('tantalim.desktop'));
    beforeEach(inject(function () {
        PageDefinitionMock = {
            page: {
                model: {
                    name: 'TestModel'
                }
            }
        };
        dataResponse = {
            status: 200,
            data: []
        };
        scope = {
            $watch: function() {},
            $on: function() {}
        };
    }));

    describe('errors', function () {
        it('should return error', inject(function ($controller) {
            dataResponse = {
                status: 200,
                data: {
                    error: 'test error'
                }
            };
            $controller('PageController', {$scope: scope, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('Error reading data from server: test error');
        }));

        it('should fail if 404', inject(function ($controller) {
            dataResponse = {
                status: 404
            };
            $controller('PageController', {$scope: scope, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('Failed to reach server. Try refreshing.');
        }));

        it('should fail if data errors', inject(function ($controller) {
            dataResponse = {
                status: 200,
                data: {
                    error: 'test'
                }
            };
            $controller('PageController', {$scope: scope, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('Error reading data from server: test');
        }));
    });

    it('should load data', inject(function ($controller) {
        $controller('PageController', {$scope: scope, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
        expect(scope.serverStatus).toBe('');
    }));

    it('should refresh data', inject(function ($controller) {
        $controller('PageController', {$scope: scope, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
        scope.refresh();
        expect(scope.serverStatus).toBe('');
    }));
});

