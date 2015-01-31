'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log) {
        //$log.debug('Starting PageCursor');

        var SmartSection = function (pageSection) {
            var self = {
                id: pageSection.id,
                viewMode: pageSection.viewMode || 'single'
            };
            cursor.sections[pageSection.id] = self;

            _.forEach(pageSection.children, function (child) {
                new SmartSection(child);
            });

            _.forEach(pageSection.page, function (child) {
                $log.warn('Using child pages is deprecated', self, child);
                new SmartSection(child);
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

        var cursor = {
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: {}
        };

        cursor.initialize = function (p) {
            new SmartSection(p);
        };

        return cursor;
    }
);
