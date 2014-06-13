'use strict';
angular.module('tantalim.common')
    .factory('ModelData', function () {
        return {
            currentModel: 'ListTables',
            model: {"data": {"modelName": "ListTables"}, "basisTable": {"dbName": "db_table", "primaryKey": {"columnName": "TableID", "dbName": "tableID"}}, "primaryKey": {"fieldName": "TableTableID"}, "defaultFilter": {"fieldName": "TableName", "basisColumn": {"dbName": "name"}}, "limit": 10, "orderBy": [
                {"fieldName": "TableModuleName", "direction": "ASC"},
                {"fieldName": "TableName", "direction": "ASC"}
            ], "fields": [
                {"fieldName": "TableTableID", "updateable": false, "basisColumn": {"dbName": "tableID", "default": "GUID"}},
                {"fieldName": "TableSQL", "basisColumn": {"dbName": "dbName"}},
                {"fieldName": "TableName", "basisColumn": {"dbName": "name"}},
                {"fieldName": "TableDatabaseID", "basisColumn": {"dbName": "databaseID"}},
                {"fieldName": "TableDatabaseName", "fieldStepID": "101", "basisColumn": {"dbName": "name"}},
                {"fieldName": "TableModuleID", "basisColumn": {"dbName": "moduleID"}},
                {"fieldName": "TableModuleCode", "fieldStepID": "100", "basisColumn": {"dbName": "moduleCode"}},
                {"fieldName": "TableModuleName", "fieldStepID": "100", "basisColumn": {"dbName": "name"}}
            ], "steps": [
                {"stepStepID": "100", "stepPreviousStepID": null, "joinToTableSql": "app_module", "joinRequired": "0", "joinColumns": [
                    {"fromColSql": "moduleID", "fromText": null, "toColSql": "moduleID"}
                ], "stepCount": 1},
                {"stepStepID": "101", "stepPreviousStepID": null, "joinToTableSql": "db_database", "joinRequired": "0", "joinColumns": [
                    {"fromColSql": "databaseID", "toColSql": "databaseID"}
                ], "stepCount": 2}
            ]},
            page: {"id": "ListTables", "title": "List Tables", "modelName": "ListTables", "viewMode": "single", "quickView": [
                {"fieldName": "TableName", "fieldLabel": "Table Name"}
            ], "listFields": [
                {"fieldName": "TableSQL", "fieldLabel": "SQL"},
                {"fieldName": "TableName", "fieldLabel": "Table Name"},
                {"fieldName": "TableModuleName", "fieldLabel": "Module"},
                {"fieldName": "TableDatabaseName", "fieldLabel": "Database"}
            ], "splitFields": [
                {"fieldName": "TableModuleCode", "fieldLabel": "Module", "disabled": true},
                {"fieldName": "TableName", "fieldLabel": "Table Name"}
            ], "formFields": [
                {"fieldName": "TableTableID", "fieldLabel": "ID", "disabled": true},
                {"fieldName": "TableSQL", "fieldLabel": "SQL"},
                {"fieldName": "TableName", "fieldLabel": "Table Name"},
                {"fieldName": "TableModuleID", "fieldLabel": "ModuleID", "disabled": true},
                {"fieldName": "TableModuleName", "fieldLabel": "Module", "fieldType": "select", "select": {"model": "ListModules", "display": "ModuleModuleName", "copy": [
                    {"from": "ModuleModuleName", "to": "TableModuleName"},
                    {"from": "ModuleModuleCode", "to": "TableModuleCode"},
                    {"from": "ModuleModuleID", "to": "TableModuleID"}
                ], "where": []}},
                {"fieldName": "TableModuleCode", "fieldLabel": "Module Code", "disabled": true}
            ]}
        };
    });
