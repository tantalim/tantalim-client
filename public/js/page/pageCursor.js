'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log) {
        $log.debug('Starting PageCursor');

        var cursor = {
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: {},
            toConsole: function() {
                console.log('PageCursor.current', cursor.current);
                console.log('PageCursor.sections', cursor.sections);
            }
        };

        var SmartSection = function (pageSection) {
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode
            };
            cursor.sections[pageSection.name] = self;

            _.forEach(pageSection.children, function (child) {
                new SmartSection(child);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor');
            new SmartSection(p);
        };

        return cursor;
    }
);
