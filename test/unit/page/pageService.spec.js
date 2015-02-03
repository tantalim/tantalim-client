'use strict';

(function () {
    describe('PageService', function () {
        var $httpBackend, service;

        beforeEach(module('tantalim.common'));
        beforeEach(inject(function ($injector, PageService) {
            service = PageService;
            $httpBackend = $injector.get('$httpBackend');
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should read data', function () {
            $httpBackend.expectGET('/data/Person?').respond(200, {});;
            service.readModelData('Person');
            $httpBackend.flush();
        });

        it('should filter data', function () {
            $httpBackend.expectGET('/data/Person?filterString=myfilter').respond(200, {});;
            service.readModelData('Person', 'myfilter');
            $httpBackend.flush();
        });

        it('should filter and page data', function () {
            $httpBackend.expectGET('/data/Person?filterString=myfilter&pageNumber=2').respond(200, {});;
            service.readModelData('Person', 'myfilter', 2);
            $httpBackend.flush();
        });

        it('should page data', function () {
            $httpBackend.expectGET('/data/Person?pageNumber=2').respond(200, {});;
            service.readModelData('Person', '', 2);
            $httpBackend.flush();
        });
    });
})
();
