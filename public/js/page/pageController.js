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
            Global.pageLoaded = true;
            $scope.serverStatus = 'Loading...';
            $scope.serverError = '';
            $scope.current = {};
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
            PageCursor.initialize(ModelData.page);
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