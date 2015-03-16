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
            _.forEach(pageSection.sections, function (section) {
                new SmartSection(section);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor', p);
            _.forEach(p.sections, function (section) {
                new SmartSection(section);
            });
        };

        return cursor;
    }
);
