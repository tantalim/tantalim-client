'use strict';

angular.module('tantalim.common')
    .factory('Global', [
        function () {
            var _this = this;
            _this._data = {
                pageName: window.pageName,
                modelName: window.pageName,
                user: window.user,
                authenticated: !!window.user
            };

            return _this._data;
        }
    ]);
