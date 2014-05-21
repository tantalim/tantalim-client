'use strict';

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $routeParams, Global, ModelData, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        if (ModelData.error) {
            $scope.serverStatus = '';
            $scope.serverError = ModelData.error;
            return;
        }

        function attachModelCursorToScope() {
            $scope.ModelCursor = ModelCursor;
            $scope.current = ModelCursor.current;
            $scope.action = ModelCursor.action;
            $scope.serverStatus = null;
            keyboardManager.bind('up', function () {
                if ($scope.currentModel) {
                    $scope.action.previous($scope.currentModel);
                }
            });
            keyboardManager.bind('down', function () {
                if ($scope.currentModel) {
                    $scope.action.next($scope.currentModel);
                }
            });
            keyboardManager.bind('ctrl+d', function () {
                if ($scope.currentModel) {
                    $scope.action.delete($scope.currentModel);
                }
            });
            keyboardManager.bind('ctrl+n', function () {
                if ($scope.currentModel) {
                    $scope.action.insert($scope.currentModel);
                }
            });
        }

        if (!Global.pageLoaded) {
            console.info('Starting PageController');
            Global.pageLoaded = true;
            $scope.serverStatus = 'Loading...';
            $scope.serverError = '';
            PageService.readModelData(ModelData.page.modelName)
                .then(function (d) {
                    $scope.serverStatus = '';
                    if (d.status !== 200) {
                        $scope.serverError = 'Failed to reach server. Try refreshing.';
                        return;
                    }
                    if (d.data.error) {
                        $scope.serverError = 'Error reading data from server: ' + d.data.error;
                        return;
                    }
                    ModelCursor.setRoot(ModelData.model, d.data);
                    attachModelCursorToScope();
                });
            PageCursor.setPage(ModelData.page);
        } else {
            attachModelCursorToScope();
        }

        if ($routeParams.subPage) {
            $scope.visibleView = $routeParams.subPage;
        } else {
            $scope.visibleView = ModelData.page.id;
        }
        $scope.changeSubPage = function (pageName) {
            $scope.visibleView = pageName;
        };

        $scope.PageCursor = PageCursor;
        $scope.staticContent = ModelData.staticContent;
        $scope.currentModel = ModelData.currentModel;
        Global.modelName = $scope.currentModel;

        $scope.listSmartSelect = {};
        $scope.runSmartSelect = function (sourceModel, modelName, queryValue) {
            PageService.queryModelData(sourceModel, queryValue).then(function (d) {
                $scope.listSmartSelect[sourceModel] = d.data;
            });
        };
        $scope.chooseSmartSelect = function (modelName, copyFields, row) {
            ModelCursor.current.instances[modelName].selectOption(row, copyFields);
            ModelCursor.change(ModelCursor.current.instances[modelName]);
        };

        $scope.rowChanged = function (thisInstance) {
            ModelCursor.change(thisInstance);
        };

        $scope.save = function () {
            $scope.serverStatus = 'Saving...';
            ModelSaver.save(ModelData.model, ModelCursor.root, function (status) {
                $scope.serverStatus = status;
                if (!status) {
                    ModelCursor.dirty = false;
                }
            });
        };
        keyboardManager.bind('ctrl+s', function () {
            $scope.save();
        });
    }
);