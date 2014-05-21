'use strict';

(function () {
    describe('ModelSaver', function () {
        var service;

        beforeEach(module('tantalim.desktop'));
        beforeEach(inject(function (ModelSaver) {
            service = ModelSaver;
        }));

        it('should do nothing with nothing', function () {
            var model = {
                data: { modelName: 'Test' }
            };

            var dto = service.convertToDto(model, {});
            expect(dto.length).toBe(0);
        });

        it('should do nothing with no changes', function () {
            var model = {
                data: { modelName: 'Test' }
            };

            var dto = service.convertToDto(model, {
                rows: [
                    {
                        state: 'NO_CHANGE',
                        id: '1',
                        data: {
                            Name: 'Foo'
                        }
                    }
                ],
                deleted: []
            });
            expect(dto.length).toBe(0);
        });

        describe('CUD Single Row', function () {
            var model = {
                data: { modelName: 'Test' }
            };

            var defaultData = function () {
                return {
                    rows: [],
                    deleted: []
                };
            }

            it('should insert', function () {
                var data = defaultData();
                data.rows.push({
                    state: 'INSERTED',
                    id: '1',
                    data: {
                        Name: 'Foo'
                    }
                });
                var dto = service.convertToDto(model, data);
                expect(dto[0]).toEqual({
                    state: 'INSERTED',
                    tempID: '1',
                    data: {
                        Name: 'Foo'
                    }
                });
            });

            it('should update', function () {
                var data = defaultData();
                data.rows.push({
                    state: 'UPDATED',
                    id: '1',
                    data: {
                        Name: 'Foo'
                    }
                });
                var dto = service.convertToDto(model, data);
                expect(dto[0]).toEqual({
                    state: 'UPDATED',
                    id: '1',
                    data: {
                        Name: 'Foo'
                    }
                });
            });

            it('should delete', function () {
                var data = defaultData();
                data.deleted.push({
                    id: '1',
                    data: {
                        Name: 'Foo'
                    }
                });
                var dto = service.convertToDto(model, data);
                expect(dto[0]).toEqual({
                    state: 'DELETED',
                    id: '1'
                });
            });

        });

        describe('CUD Child Row', function () {
            var model = {
                data: { modelName: 'ParentModel' },
                children: [
                    {
                        data: { modelName: 'ChildModel' }
                    }
                ]
            };

            var defaultData = function () {
                return {
                    rows: [],
                    deleted: []
                };
            }

            it('should update child row', function () {
                var data = defaultData();
                data.rows.push({
                    state: 'CHILD_UPDATED',
                    id: '1',
                    data: {
                        Name: 'Foo'
                    },
                    childModels: {
                        ChildModel: {
                            rows: [
                                {
                                    state: 'UPDATED',
                                    id: '2',
                                    data: {
                                        ChildName: 'Bar'
                                    }
                                },
                                {
                                    state: 'NO_CHANGE',
                                    id: '3',
                                    data: {
                                        ChildName: 'Baz'
                                    }
                                }
                            ]
                        }
                    }
                });
                var dto = service.convertToDto(model, data);
                expect(dto[0]).toEqual({
                    state: 'CHILD_UPDATED',
                    id: '1',
                    data: {
                        Name: 'Foo'
                    },
                    children: {
                        ChildModel: [
                            {
                                state: 'UPDATED',
                                id: '2',
                                data: {
                                    ChildName: 'Bar'
                                }
                            }
                        ]
                    }
                });
            });
        });
    });
})
    ();
