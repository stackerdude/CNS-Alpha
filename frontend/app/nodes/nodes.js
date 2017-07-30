/**
 * Created by wayneirwin on 22/2/17.
 */
'use strict';

angular.module('myApp.nodes', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/nodes', {
            templateUrl: 'nodes/nodes.html',
            controller: 'NodesCtrl'
        });
    }])


    .controller('NodesCtrl', ["$scope", "$http", function($scope, $http) {
        var nodeCtrl = this;

        $scope.nodeArrayLeft = [];
        $scope.nodeArrayRight = [];

        $scope.init = function() {
            //    Load the current data for the nodes
            $http.get('http://10.1.1.11:8080/allNodeInfo').then(nodeDataReceived, nodeDataError);

        };

        var nodeDataReceived = function(response) {
            //    Clear the model
            $scope.nodeArrayLeft = [];
            $scope.nodeArrayRight = [];

            for (var i = 0; i < response.data.length / 2; i++) {
                $scope.nodeArrayLeft.push(response.data[i]);
            };

            for (var i = Math.ceil(response.data.length / 2); i < response.data.length; i++) {
                $scope.nodeArrayRight.push(response.data[i]);

            }
            console.log($scope.nodeArrayLeft);
            console.log($scope.nodeArrayRight);

        };


        var nodeDataError = function(response) {
            console.log(response);
        };

        $scope.nodeClicked = function(side, index, control) {
            console.log(side + index);
            var node;
            if (side === "left") {
                node = $scope.nodeArrayLeft[index]
            } else if (side === "right") {
                node = $scope.nodeArrayRight[index];
            }

            //    Now we have the node that needs to be updated
            //    Make the backend call
            //    Payload for post request
            var payload = {};
            payload.node_id = node.id;
            payload.node_gpio = [node.gpio];
            // Determine if the req is to toggle power or lock the record
            if(control == "status"){
              if (node.status === "off") {
                  payload.node_status = "on";
              } else {
                  payload.node_status = "off";
              }
            }
            else if(control == "lock"){
              if (node.lock === "off") {
                  payload.node_status = "lock";
              } else {
                  payload.node_status = "unlock";
              }
            }


            $http.post('http://10.1.1.11:8080/setNodeStatus', payload).then(nodeUpdateRecieved, nodeUpdateError);

        }


        var nodeUpdateRecieved = function(nodeDataReceived) {
            console.log(nodeDataReceived);
            //    update the model with the new data
            $scope.init();
        };

        var nodeUpdateError = function(nodeDataError) {
            console.log(nodeDataError);

        };

    }]);
