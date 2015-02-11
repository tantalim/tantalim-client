'use strict';

/**
 * Logger.log(Message({});
 */
angular.module('tantalim.common')
    .factory('Logger', [
        function () {
            var messages = [];

            var _self = {
                Message: function (content) {
                    var defaults = {

                    };

                    // merge content and defaults
                    return this;
                },
                log: function (message) {
                    messages.push(message);
                }
            };
            return _self;
        }
    ]);