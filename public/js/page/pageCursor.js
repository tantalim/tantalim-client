'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log) {
        //$log.debug('Starting PageCursor');

        var _stub = function () {
        };
        var self = {
            pages: {},
            views: {},
            current: null,
            visibleView: null,
            setPage: _stub,
            action: {
            }
        };

        self.setPage = function (p) {
            new SmartPage(p);
            new SmartView(p);
        };

        var SmartPage = function (page) {
            var thisPage = {
                id: page.id,
                viewMode: page.viewMode
            };
            self.pages[page.id] = thisPage;

            _.forEach(page.pages, function (childPage) {
                new SmartPage(childPage);
            });
        };
/*
        var gridOptions = function (view) {

            var getDataName = function (view) {
                return 'ModelCursor.current.sets.' + view.modelName + '.rows';
            };

            var getColumnDefs = function (fields) {
                return _.map(fields, function (field) {
                    return {
                        field: 'data.' + field.fieldName,
                        displayName: field.fieldLabel
                    };
                });
            };

            var selectedItems = [];

            var afterSelectionChange = function(rowItem) {
                if (selectedItems.length > 0) {
                    var currentSet = selectedItems[0].nodeSet;
                    currentSet.moveTo(rowItem.rowIndex);
                }
            };

            return {
                afterSelectionChange: afterSelectionChange,
//                enableSorting: false,
//                enableColumnReordering: true,
                enableColumnResize: true,
                enableCellEdit: true,
                enablePinning: true,
                enableHighlighting: true,
                showColumnMenu: true,
                groupsCollapsedByDefault: false,
                multiSelect: false,
//                keepLastSelected: false,
                selectedItems: selectedItems,
                pagingOptions: { pageSizes: [10, 100, 1000], pageSize: 10, totalServerItems: 55, currentPage: 1 },
                columnDefs: getColumnDefs(view.listFields),
                data: getDataName(view)
            };
        };
*/

        var SmartView = function (view) {
            var thisView = {
                id: view.id
            };
            // Removing ngGrid for now
            // gridOptions: gridOptions(view)

            self.views[view.id] = thisView;

            _.forEach(view.children, function (childView) {
                new SmartView(childView);
            });
            _.forEach(view.pages, function (childView) {
                new SmartView(childView);
            });
        };

        return self;
    }
);
