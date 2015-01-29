'use strict';

(function () {
    describe('tantalim.desktop', function () {
        var service;

        beforeEach(module('tantalim.desktop'));

        describe('GUID Service', function () {

            it('should generate a 36 char guid', inject(function (GUID) {
                var guid = GUID();
                expect(guid.length).toBe(36);
            }));
        });
    });
})
    ();