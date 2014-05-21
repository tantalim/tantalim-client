'use strict';

(function () {
    describe('ModelCursor', function () {
        var service;

        beforeEach(module('tantalim.desktop'));

        var sampleModel, sampleList;

        var initialize = function () {
            service.setRoot(sampleModel, sampleList);
        };

        beforeEach(inject(function (ModelCursor) {
            service = ModelCursor;
            sampleModel = {};
            sampleList = [];
        }));

        describe('WithSingleModel', function () {
            beforeEach(function () {
                sampleModel = {
                    data: {modelName: 'Tables'},
                    orderBy: 'TableName'
                };
                sampleList = [
                    {
                        "id": 1,
                        "data": {
                            "TableTableID": 1,
                            "TableName": "Foo"
                        }
                    }
                ];
            });

            it('should set the data', function () {
                initialize();
                expect(service.root.rows).toBeTruthy();
            });

            describe('Sorting', function () {
                beforeEach(function () {
                    sampleList = [
                        {
                            "id": 2,
                            "data": {
                                "TableTableID": 2,
                                "TableName": "Beta"
                            }
                        },
                        {
                            "id": 1,
                            "data": {
                                "TableTableID": 1,
                                "TableName": "Alpha"
                            }
                        },
                        {
                            "id": 3,
                            "data": {
                                "TableTableID": 3,
                                "TableName": "Charlie"
                            }
                        }
                    ];
                });

                it('should sort data', function () {
                    initialize();
                    service.root.sort();
                    expect(service.root.rows[0].id).toBe(1);
                });
                it('should sort data in reverse', function () {
                    initialize();
                    service.root.sortReverse();
                    expect(service.root.rows[0].id).toBe(3);
                });
            });

            describe('Moving', function () {
                beforeEach(function () {
                    sampleList = [
                        {
                            "id": 1,
                            "data": {
                                "TableTableID": 1,
                                "TableName": "Alpha"
                            }
                        },
                        {
                            "id": 2,
                            "data": {
                                "TableTableID": 2,
                                "TableName": "Beta"
                            }
                        }
                    ];
                });

                it('should set the first record as current', function () {
                    initialize();
                    expect(service.root.getInstance().id).toBe(1);
                });
                it('should navigate next', function () {
                    initialize();
                    service.root.moveNext();
                    expect(service.root.getInstance().id).toBe(2);
                });
                it('should navigate previous', function () {
                    initialize();
                    service.root.moveTo(1);
                    service.root.movePrevious();
                    expect(service.root.getInstance().id).toBe(1);
                });
            });

            describe('Insert', function () {
                it('should set insert a new record', function () {
                    sampleList = [];
                    initialize();
                    service.root.insert();
                    expect(service.root.rows.length).toBe(1);
                    expect(service.current.instances.Tables.id).toBeTruthy();
                });
                it('should set delete an existing record', function () {
                    initialize();
                    expect(service.root.deleted.length).toBe(0);
                    service.root.delete();
                    expect(service.root.rows.length).toBe(0);
                    expect(service.root.deleted.length).toBe(1);
                });
                it('should set delete a new record', function () {
                    sampleList = [];
                    initialize();
                    service.root.insert();
                    service.root.delete();
                    expect(service.root.rows.length).toBe(0);
                    expect(service.root.deleted.length).toBe(0); // TODO this isn't working yet :(
                });

            });
        });

        describe('WithParentChildModel', function () {
            beforeEach(function () {
                sampleModel = {
                    data: {modelName: 'Tables'},
                    orderBy: 'TableName',
                    children: [
                        {
                            data: {modelName: 'Columns'},
                            orderBy: 'ColumnName'
                        }
                    ]
                };
                sampleList = [
                    {
                        "id": 1,
                        "data": {
                            "TableName": "A"
                        },
                        "children": {
                            "Columns": [
                                {
                                    "id": 2,
                                    "data": {
                                        "ColumnName": "A1"
                                    }
                                },
                                {
                                    "id": 3,
                                    "data": {
                                        "ColumnName": "A2"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 4,
                        "data": {
                            "TableName": "B"
                        },
                        "children": {
                            "Columns": [
                                {
                                    "id": 5,
                                    "data": {
                                        "ColumnName": "B3"
                                    }
                                },
                                {
                                    "id": 6,
                                    "data": {
                                        "ColumnName": "B4"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        "id": 99,
                        "data": {
                            "TableName": "Z"
                        }
                    }
                ];
            });

            it('should get the first instance of Tables', function () {
                initialize();
                var result = service.root.getInstance();
//                    var result = service.current.Tables;
                expect(result.id).toEqual(1);
            });

            it('should set the first child row', function () {
                initialize();
                expect(service.root.rows[0].childModels.Columns.getInstance().id).toEqual(2);
                expect(service.root.rows[1].childModels.Columns.getInstance().id).toEqual(5);
            });

            it('should set the clear the child models', function () {
                initialize();
                service.root.moveTo(2);
                expect(service.current.sets.Columns).toEqual(null);
            });

            it('should get the first instance of Columns', function () {
                initialize();
                var result = service.current.instances.Columns;
                expect(result.id).toEqual(2);
            });

            it('should get the first set of Columns', function () {
                initialize();
                var result = service.current.sets.Columns;
                expect(result.rows.length).toEqual(2);
            });

        });

    });
})
    ();
