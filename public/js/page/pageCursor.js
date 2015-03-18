'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log, ModelCursor, keyboardManager) {
        $log.debug('Starting PageCursor');

        var cursor = {
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: [],
            getSection: function (sectionName, level) {
                if (!cursor.sections[level] || !cursor.sections[level][sectionName]) {
                    $log.info('cursor.sections[level][sectionName] has not been created yet');
                    return;
                }
                return cursor.sections[level][sectionName];
            },
            toConsole: function () {
                console.log('PageCursor.current', cursor.current);
                console.log('PageCursor.sections', cursor.sections);
            }
        };

        var VIEWMODE = {FORM: "form", TABLE: "table"};

        var SmartSection = function (pageSection, level) {
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode,
                model: pageSection.model,
                fields: pageSection.fields,
                toggleViewMode: function () {
                    if (self.viewMode === VIEWMODE.FORM) {
                        self.viewMode = VIEWMODE.TABLE;
                    } else {
                        var currentSet = self.getCurrentSet();
                        currentSet.selectedRows.end = currentSet.selectedRows.start;
                        self.viewMode = VIEWMODE.FORM;
                    }
                },
                focus: function() {
                    cursor.current = self;
                },
                level: level || 0,
                getCurrentSet: function () {
                    return ModelCursor.getCurrentSet(self.model.name, self.level);
                }
            };

            if (!cursor.sections[self.level]) {
                cursor.sections[self.level] = {};
            }
            cursor.sections[self.level][pageSection.name] = self;
            _.forEach(pageSection.sections, function (section) {
                // Maybe we should only increase level if the lower section has it's own model
                new SmartSection(section, self.level + 1);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor', p);
            _.forEach(p.sections, function (section) {
                new SmartSection(section);
            });
        };


        function setupHotKeys() {
            keyboardManager.bind('up', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.movePrevious();
                }
            });
            keyboardManager.bind('tab', function () {
                if ($scope.currentSet) {

                    //PageCursor
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('enter', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('down', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.moveNext();
                }
            });
            keyboardManager.bind('ctrl+d', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.delete();
                }
            });
            keyboardManager.bind('ctrl+n', function () {
                if ($scope.currentSet) {
                    $scope.currentSet.insert();
                }
            });

            keyboardManager.bind('ctrl+s', function () {
                $scope.save();
            });
            keyboardManager.bind('meta+s', function () {
                $scope.save();
            });
            keyboardManager.bind('meta+c', function () {
                $scope.action.copy();
            });
            keyboardManager.bind('meta+v', function () {
                $scope.action.paste();
            });
            keyboardManager.bind('ctrl+shift+d', function () {
                console.log('DEBUGGING');
                ModelCursor.toConsole();
                PageCursor.toConsole();
            });

        }


        return cursor;
    }
);
