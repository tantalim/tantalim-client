'use strict';
/* global _ */

angular.module('tantalim.desktop')
    .factory('PageCursor', function ($log) {
        //$log.debug('Starting PageCursor');

        var cursor = {
            initialized: false,
            /**
             * A pointer to the currently selected section. Useful for key binding and such.
             */
            current: null,
            /**
             * A list of each section on the page
             */
            sections: {}
        };

        var SmartSection = function (pageSection) {
            var self = {
                name: pageSection.name,
                viewMode: pageSection.viewMode || 'single'
            };
            cursor.sections[pageSection.name] = self;

            _.forEach(pageSection.children, function (child) {
                new SmartSection(child);
            });

            _.forEach(pageSection.page, function (child) {
                $log.warn('Using child pages is deprecated', self, child);
                new SmartSection(child);
            });
        };

        cursor.initialize = function (p) {
            $log.debug('initializing PageCursor');
            new SmartSection(p);
            cursor.initialized = true;
        };

        return cursor;
    }
);
