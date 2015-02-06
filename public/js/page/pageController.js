'use strict';

angular.module('tantalim.desktop')
    .controller('PageController',
    function ($scope, $routeParams, Global, ModelData, PageService, ModelCursor, ModelSaver, PageCursor, keyboardManager) {
        if (ModelData.error) {
            console.error('Error retrieving ModelData: ', ModelData.error);
            $scope.serverStatus = '';
            $scope.serverError = ModelData.error;
            if (ModelData.message) {
                $scope.serverError += ': ' + ModelData.message;
            }
            return;
        }

        function attachModelCursorToScope() {
            $scope.ModelCursor = ModelCursor;
            $scope.current = ModelCursor.current;
            $scope.action = ModelCursor.action;
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

        function loadData() {
            $scope.serverStatus = 'Loading data...';
            $scope.serverError = '';
            $scope.current = {};

            PageService.readModelData(ModelData.page.modelName, $routeParams.filterString, $routeParams.pageNumber)
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
                    $scope.filterString = $routeParams.filterString;
                    $scope.pageNumber = $routeParams.pageNumber;
                    ModelCursor.setRoot(ModelData.model, d.data);
                    attachModelCursorToScope();
                });
            // TODO Don't reinitialize unless needed
        }

        function isDataLoaded() {
            if (!$scope.current) {
                return false;
            }
            if ($scope.filterString !== $routeParams.filterString) {
                return false;
            }
            if ($scope.pageNumber !== $routeParams.pageNumber) {
                return false;
            }
            return true;
        }

        if (isDataLoaded()) {
            attachModelCursorToScope();
        } else {
            loadData();
        }

        if (!PageCursor.initialized) {
            PageCursor.initialize(ModelData.page);
        }

        $scope.PageCursor = PageCursor;
        $scope.staticContent = ModelData.staticContent;
        $scope.currentModel = ModelData.currentModel;
        Global.modelName = $scope.currentModel;

        $scope.rowChanged = function (thisInstance) {
            ModelCursor.change(thisInstance);
        };

        $scope.refresh = function () {
            if (ModelCursor.dirty && !$scope.serverStatus) {
                $scope.serverStatus = 'There are unsaved changes. Click [Refresh] again to discard those changes.';
                return;
            }
            loadData();
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
        keyboardManager.bind('ctrl+shift+d', function () {
            console.log('DEBUGGING');
            ModelCursor.toConsole();
        });
    }
);