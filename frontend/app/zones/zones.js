/**
 * Created by wayneirwin on 23/2/17.
 */
/**
 * Created by wayneirwin on 22/2/17.
 */
'use strict';

angular.module('myApp.zones', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/zones', {
            templateUrl: 'zones/zones.html',
            controller: 'ZonesCtrl'
        });
    }])

    .controller('ZonesCtrl', ["$scope", "$http", "$mdDialog", function($scope, $http, $mdDialog) {

        $scope.currentZones = [];
        $scope.newZone = {
            "nodes": [{}]
        };
        $scope.allNodes = [];


        $scope.init = function() {

            $http.get('http://10.1.1.11:8080/allZoneInfo').then(zoneDataReceived, zoneDataError);
            $http.get('http://10.1.1.11:8080/allNodeInfo').then(nodeDataReceived, nodeDataError);


        };

        var zoneDataReceived = function(response) {
            //    Clear the model
            console.log(response);
            $scope.currentZones = response.data;
            $http.get('http://10.1.1.11:8080/allZoneInfo').then(zoneNodesDataReceived, zoneNodesDataError);

        };


        var zoneDataError = function(response) {
            console.log(response);
        };

        var zoneNodesDataReceived = function(response) {
            console.log(response);

            //    Insert the data to the right node
            for (var i = 0; i < response.data.length; i++) {
                var node = response.data[i];
                var zone;
                //    Determine the right zone
                for (var m = 0; m < $scope.currentZones.length; m++) {
                    zone = $scope.currentZones[m];
                    if (node.zone_id == zone.id) {
                        //    We have found the right zone
                        break;
                    }

                }

                if (!zone.nodes) {
                    zone.nodes = [];
                }
                zone.nodes.push(node);

            }
        };

        var zoneNodesDataError = function(response) {
            console.log(response);
        };





        var nodeDataReceived = function(response) {
            console.log(response);
            $scope.allNodes = response.data;
        };

        var nodeDataError = function(response) {
            console.log(response);
        };

        $scope.addNode = function() {
            $scope.newZone.nodes.push({});
            console.log("added");
        }

        $scope.createZone = function() {
            // Get the zone name
            var zone_name = $scope.newZone.name;
            var zone_location = $scope.newZone.name;
            var node_ids = [];
            for (var i = 0; i < $scope.newZone.nodes.length; i++) {
                node_ids.push($scope.newZone.nodes[i].id)
            }

            var zoneCreateConfig = {
                "zone_name": zone_name,
                "zone_location": zone_location,
                "zone_ids": node_ids
            };
            //    Create the zone, and in the callback create the zoneNodes

            $http.post('http://10.1.1.11:8080/createZone', zoneCreateConfig).then(zoneSaved, nodeDataError);

        }

        var zoneSaved = function() {
          $http.get('http://10.1.1.11:8080/allZoneInfo').then(zoneDataReceived, zoneDataError);

        }

        $scope.showCreatePopup = function(ev) {
            $mdDialog.show({
                    controller: DialogController,
                    locals: {
                        parent: $scope
                    },
                    templateUrl: 'zones/createZone.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
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
            $scope.locals = locals.parent;

            $scope.hide = function() {
                $mdDialog.hide();
            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.answer = function(answer) {
                $mdDialog.hide(answer);
            };
            $scope.createZone = function(answer) {
              $scope.locals.createZone();
              $scope.cancel();
            };
        }




    }]);
/**
 * Created by wayneirwin on 23/2/17.
 */
