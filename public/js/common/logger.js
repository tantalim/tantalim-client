'use strict';

/**
 * Logger.error("Error here");
 * Logger.log({
 *  message: "Or like this",
 *  type: Logger.TYPE.WARN,
 *  source: 'ModelCursor.js Line 123',
 *  details: 'Should fix it here.'
 * });
 */
angular.module('tantalim.common')
    .factory('Logger', [
        function () {

            var _self = {
                TYPE: {INFO: 'info', WARN: 'warn', ERROR: 'warn', DEBUG: 'debug'},
                history: [],
                log: function (content, messageType) {
                    content = normalizeContent(content);
                    content.type = messageType || _self.TYPE.INFO;

                    if (content.type === _self.TYPE.ERROR) {
                        _self._error = content.message
                    } else {
                        _self._status = content.message
                    }

                    _self.history.push(content);
                },
                info: function (content) {
                    _self.log(content);
                },
                warn: function (content) {
                    _self.log(content, _self.TYPE.WARN);
                },
                debug: function (content) {
                    _self.log(content, _self.TYPE.DEBUG);
                },
                error: function (content) {
                    _self.log(content, _self.TYPE.ERROR);
                },
                getStatus: function (status) {
                    return _self._status;
                },
                getError: function () {
                    return _self._error;
                }
            };

            function normalizeContent(content) {
                if (typeof content === 'string') {
                    return {message: content};
                } else return content;
            }

            return _self;
        }
    ]);