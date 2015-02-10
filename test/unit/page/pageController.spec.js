'use strict';

describe('PageController', function () {
    var scope,
        PageDefinitionMock,
        ModelDataMock,
        dataResponseMock = {},
        pageServiceMock = {
            readModelData: function () {
                return {
                    then: function (response) {
                        response(dataResponseMock);
                    }
                }
            }
        };

    beforeEach(module('tantalim.desktop'));
    beforeEach(inject(function () {
        PageDefinitionMock = {
            model: {},
            page: {}
        };
        ModelDataMock = {
            model: {},
            page: {}
        };
        dataResponseMock = {
            status: 200,
            data: {}
        };
        scope = {};
    }));

    describe('errors', function () {
        it('should return error', inject(function ($controller) {
            ModelDataMock.error = 'test error';
            $controller('PageController', {$scope: scope, ModelData: ModelDataMock, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('test error');
        }));

        it('should fail if 404', inject(function ($controller) {
            dataResponseMock = {
                status: 404
            };
            $controller('PageController', {$scope: scope, ModelData: ModelDataMock, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('Failed to reach server. Try refreshing.');
        }));

        it('should fail if data errors', inject(function ($controller) {
            dataResponseMock = {
                status: 200,
                data: {
                    error: 'test'
                }
            };
            $controller('PageController', {$scope: scope, ModelData: ModelDataMock, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
            expect(scope.serverError).toBe('Error reading data from server: test');
        }));
    });

    it('should load data', inject(function ($controller) {
        $controller('PageController', {$scope: scope, ModelData: ModelDataMock, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
        expect(scope.serverStatus).toBe('');
    }));

    it('should refresh data', inject(function ($controller) {
        $controller('PageController', {$scope: scope, ModelData: ModelDataMock, PageService: pageServiceMock, PageDefinition: PageDefinitionMock});
        scope.refresh();
        expect(scope.serverStatus).toBe('');
    }));

});
