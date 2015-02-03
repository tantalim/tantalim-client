'use strict';

describe('SearchController', function () {
    var scope,
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
    beforeEach(inject(function ($rootScope) {
        ModelDataMock = {
            model: {fields: [{fieldName: 'PersonName'}]},
            page: {}
        };
        dataResponseMock = {
            status: 200,
            data: {}
        };
        scope = $rootScope.$new();
    }));

    it('should initialize', inject(function ($controller) {
        $controller('SearchController', {$scope: scope, ModelData: ModelDataMock});
        expect(scope.comparators['PersonName']).toBe('Contains');
    }));

    it('should setFilterString', inject(function ($controller) {
        $controller('SearchController', {$scope: scope, ModelData: ModelDataMock});
        scope.values.PersonName = 'John';
        scope.$digest();
        expect(scope.filterString).toBe('PersonName Contains John');
    }));
});
