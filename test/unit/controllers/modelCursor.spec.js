'use strict';

(function () {
    describe('ModelCursor', function () {
        var service, sampleModel, sampleList;

        beforeEach(module('tantalim.desktop'));

        beforeEach(inject(function (ModelCursor) {
            service = ModelCursor;
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
                service.setRoot(sampleModel, sampleList);
            });

            it('should set the data', function () {
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
                    service.setRoot(sampleModel, sampleList);
                });

                it('should sort data', function () {
                    service.root.sort();
                    expect(service.root.rows[0].id).toBe(1);
                });
                it('should sort data in reverse', function () {
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
                    service.setRoot(sampleModel, sampleList);
                });

                it('should set the first record as current', function () {
                    expect(service.root.getInstance().id).toBe(1);
                });
                it('should navigate next', function () {
                    service.action.next("Tables");
                    expect(service.root.getInstance().id).toBe(2);
                });
                it('should navigate previous', function () {
                    service.action.select("Tables", 1);
                    service.action.previous("Tables");
                    expect(service.root.getInstance().id).toBe(1);
                });
                it('should find record id = 2', function () {
                    service.action.choose("Tables", 2);
                    expect(service.root.getInstance().id).toBe(2);
                });
            });

            describe('Insert', function () {
                it('should insert a new record', function () {
                    service.setRoot(sampleModel, []);
                    var newRow = service.action.insert("Tables");
                    expect(service.root.rows.length).toBe(1);
                    expect(newRow.id).toBeTruthy();
                });

                it('should default the field value to 1', function () {
                    sampleModel = {
                        data: {modelName: 'Tables'},
                        fields: [
                            {
                                "fieldName": "TableType1",
                                "fieldDefault": {
                                    "value": "1"
                                }
                            },
                            {
                                "fieldName": "TableType2",
                                "fieldDefault": {
                                    "type": "constant",
                                    "value": "2"
                                }
                            }
                        ]
                    };
                    service.setRoot(sampleModel, []);
                    var newRow = service.action.insert("Tables");
                    expect(newRow.data.TableType1).toBe("1");
                    expect(newRow.data.TableType2).toBe("2");
                });

                it('should default the field value to 2', function () {
                    sampleModel = {
                        data: {modelName: 'Tables'},
                        fields: [
                            {
                                "fieldName": "TableName",
                                "fieldDefault": {
                                    "type": "fxn",
                                    "value": "1"
                                }
                            }
                        ]
                    };
                    service.setRoot(sampleModel, []);
                    var newRow = service.action.insert("Tables");
                    expect(newRow.data.TableName).toBe("1");
                });
            });

            describe('Delete', function () {
                it('should delete nothing when empty', function () {
                    expect(service.root.rows.length).toBe(1);
                    service.action.delete("Tables");
                    expect(service.root.rows.length).toBe(0);
                    service.action.delete("Tables");
                    expect(service.root.rows.length).toBe(0);
                });
                it('should delete an existing record', function () {
                    expect(service.root.deleted.length).toBe(0);
                    service.action.delete("Tables");
                    expect(service.root.rows.length).toBe(0);
                    expect(service.root.deleted.length).toBe(1);
                });
                it('should ignore a deleted new record', function () {
                    service.setRoot(sampleModel, []);
                    service.action.insert("Tables");
                    service.action.delete("Tables");
                    expect(service.root.rows.length).toBe(0);
                    expect(service.root.deleted.length).toBe(0);
                });
            });

            describe('ReloadFromServer', function () {
                it('should reload after insert', function () {
                    var tableSet = service.getCurrentSet("Tables");
                    var newRow = service.action.insert("Tables");
                    var id = "NEW_ID_1";
                    newRow.id = id;
                    console.debug(newRow);
                    tableSet.reloadFromServer([{
                            tempID: id
                        }]
                    );
                });
            });
        });

        describe('WithParentChildModel', function () {
            beforeEach(function () {
                sampleModel = {
                    data: {modelName: 'Tables'},
                    orderBy: 'TableName',
                    fields: [
                        {
                            "fieldName": "TableName"
                        }
                    ],
                    children: [
                        {
                            data: {modelName: 'Columns'},
                            fields: [
                                {
                                    "fieldName": "ColumnName"
                                },
                                {
                                    "fieldName": "ColumnTableName",
                                    "fieldDefault": {
                                        "type": "field",
                                        "value": "TableName"
                                    }
                                }
                            ],
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
                service.setRoot(sampleModel, sampleList);
            });

            it('should get the first instance of Tables', function () {
                var result = service.root.getInstance();
                expect(result.id).toEqual(1);
            });

            it('should set the first child row', function () {
                expect(service.root.rows[0].childModels.Columns.getInstance().id).toEqual(2);
                expect(service.root.rows[1].childModels.Columns.getInstance().id).toEqual(5);
            });

            it('should get the first instance of Columns', function () {
                var result = service.current.instances.Columns;
                expect(result.id).toEqual(2);
            });

            it('should insert new Column with TableID default', function () {
                var table = service.getCurrentInstance("Tables");
                var columns = service.getCurrentSet("Columns");
                var newColumn = columns.insert();
                expect(newColumn.data.ColumnTableName).toEqual(table.data.TableName);
            });

            it('should get child set even if data not passed in', function () {
                sampleList = [
                    {
                        "id": 1,
                        "data": {
                            "TableName": "A"
                        }
                    }
                ];
                service.setRoot(sampleModel, sampleList);
                service.getCurrentSet("Columns");
            });

            it('should get the first set of Columns', function () {
                var result = service.current.sets.Columns;
                expect(result.rows.length).toEqual(2);
            });

        });
    });
})
();
