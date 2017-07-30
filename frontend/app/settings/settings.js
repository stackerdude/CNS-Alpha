/**
 * Created by wayneirwin on 22/2/17.
 */
'use strict';

angular.module('myApp.settings', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/settings', {
            templateUrl: 'settings/settings.html',
            controller: 'SettingsCtrl'
        });
    }])


    .controller('SettingsCtrl', ["$scope", "$http", "$mdDialog", function($scope, $http, $mdDialog) {

        $scope.nodes = [];
        $scope.init = function() {
            //    Load the current data for the nodes
            $http.get('http://10.1.1.11:8080/allNodesInfo').then(nodeDataReceived, nodeDataError);

        };

        var nodeDataReceived = function(response) {
            //    Clear the model

            $scope.nodes = response.data;

        };
        var nodeDataError = function(response) {
            console.log(response);
        };

        $scope.saveNodeData = function(index) {
            var nodeObj = {}
            nodeObj.node_id = $scope.nodes[index].id;
            nodeObj.node_name = $scope.nodes[index].name;
            nodeObj.node_location = $scope.nodes[index].location;
            nodeObj.node_gpio = $scope.nodes[index].gpio;
            $http.post('http://10.1.1.11:8080/editNode', nodeObj).then(nodeEditRecieved, nodeEditError);

        };
        var nodeEditRecieved = function(response) {
            $scope.init()
        };
        var nodeEditError = function(response) {
            console.log(response);
        };



        $scope.showNodeEditPopup = function(index) {
            $mdDialog.show({
                    controller: DialogController,
                    locals: {
                        parent: $scope,
                        index: index,
                    },
                    templateUrl: 'settings/nodeEdit.tmpl.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                })
                .then(function(answer) {
                    $scope.status = 'You said the information was "' + answer + '".';
                }, function() {
                    $scope.status = 'You cancelled the dialog.';
                });
        };

        function DialogController($scope, $mdDialog, locals) {
            $scope.locals = locals.parent
            $scope.index = locals.index;

            $scope.hide = function() {
                $mdDialog.hide();
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.answer = function(answer) {
                $mdDialog.hide(answer);
            };
            $scope.saveNodeChanges = function(answer) {
                $scope.locals.saveNodeData($scope.index);
                $scope.cancel();
            };
        }



    }]);
