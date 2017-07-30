/**
 * Created by wayneirwin on 22/2/17.
 */
'use strict';

angular.module('myApp.scheduling', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/scheduling', {
            templateUrl: 'scheduling/scheduling.html',
            controller: 'SchedulingCtrl'
        });
    }])

    .controller('SchedulingCtrl', ["$scope", "$http", "$mdDialog", function($scope, $http, $mdDialog) {

        $scope.nodes = [];
        $scope.zones = [];
        $scope.types = [{
            "name": "Zone"
        }, {
            "name": "Node"
        }];
        $scope.days = [{
            "name": "Sunday",
            "id": 0
        }, {
            "name": "Monday",
            "id": 1
        }, {
            "name": "Tuesday",
            "id": 2
        }, {
            "name": "Wednesday",
            "id": 3
        }, {
            "name": "Thursday",
            "id": 4
        }, {
            "name": "Friday",
            "id": 5
        }, {
            "name": "Saturday",
            "id": 6
        }];
        $scope.frequencies = [{
            "freq": "Daily"
        }, {
            "freq": "Weekly"
        }];

        $scope.schedule = {};
        $scope.schedules = [];






        $scope.init = function() {
            // Load all entites
            //    Load the current data for the nodes
            $http.get('http://localhost:8080/allSchedule').then(scheduleDataReceived, scheduleDataError);
            $http.get('http://localhost:8080/allNodeInfo').then(nodeDataReceived, nodeDataError);
            $http.get('http://localhost:8080/allZoneInfo').then(zoneDataReceived, zoneDataError);

        };

        $scope.deleteSchedule = function(id) {
          var deletePayload = {};
          deletePayload.schedule_id = id;
          $http.post('http://localhost:8080/deleteSchedule', deletePayload).then(deleteScheduleDataReceived, deleteScheduleDataError);

        };


        $scope.toggleScheduleLock = function(index) {
            //Get the of the schedule to toggle
            var schedule = $scope.schedules[index]
            //    Now we have the node that needs to be updated
            //    Make the backend call
            //    Payload for post request
            var payload = {};
            payload.schedule_id = schedule.id;

            // Determine if the req is to toggle power or lock the record

              if (schedule.lock === "off") {
                  payload.schedule_status = "lock";
              } else {
                  payload.schedule_status = "unlock";
              }



            $http.post('http://localhost:8080/setScheduleStatus', payload).then(lockScheduleDataReceived, lockScheduleDataError);

        }



        var deleteScheduleDataReceived = function(response) {
          $http.get('http://localhost:8080/allSchedule').then(scheduleDataReceived, scheduleDataError);


        };


        var deleteScheduleDataError = function(response) {
            console.log(response);
        };

        var lockScheduleDataReceived = function(response) {
          $http.get('http://localhost:8080/allSchedule').then(scheduleDataReceived, scheduleDataError);


        };


        var lockScheduleDataError = function(response) {
            console.log(response);
        };


        var zoneDataReceived = function(response) {
            $scope.zones = response.data;

        };


        var zoneDataError = function(response) {
            console.log(response);
        };

        var nodeDataReceived = function(response) {
            $scope.nodes = response.data;

        };


        var nodeDataError = function(response) {
            console.log(response);
        };
        //
        // var schedule_type = req.body.schedule_type;
        // var associated_id = req.body.associated_id;
        // var schedule_startdate = req.body.schedule_startdate;
        // var schedule_enddate = req.body.schedule_enddate;
        // var schedule_day = req.body.schedule_day;
        // var schedule_freq = req.body.schedule_freq;
        // var schedule_starttime = req.body.schedule_starttime;
        // var schedule_length = req.body.schedule_length;

        $scope.createSchedule = function() {
            // Get the zone name
            var scheduleCreatePayload = {};
            scheduleCreatePayload.schedule_type = $scope.schedule.type;
            scheduleCreatePayload.associated_id = $scope.schedule.id;
            scheduleCreatePayload.schedule_startdate = $scope.schedule.startdate.toISOString().split('T')[0];
            scheduleCreatePayload.schedule_enddate = $scope.schedule.enddate.toISOString().split('T')[0];
            scheduleCreatePayload.schedule_day = $scope.schedule.day;
            scheduleCreatePayload.schedule_freq = $scope.schedule.freq;
            scheduleCreatePayload.schedule_starttime = $scope.schedule.starttime.toLocaleTimeString();
            scheduleCreatePayload.schedule_length = $scope.schedule.length;
            scheduleCreatePayload.schedule_name = $scope.schedule.name;
            scheduleCreatePayload.schedule_onlength = $scope.schedule.onlength;
            scheduleCreatePayload.schedule_offlength = $scope.schedule.offlength;




            $http.post('http://localhost:8080/createSchedule', scheduleCreatePayload).then(scheduleSaved, nodeDataError);

        }

        var scheduleSaved = function() {
            $http.get('http://localhost:8080/allSchedule').then(scheduleDataReceived, scheduleDataError);

        }

        var scheduleDataReceived = function(response) {
            $scope.schedules = response.data;

            // Map the day of Weekly

            for(var i = 0; i < $scope.schedules.length; i++){
              for (var k = 0; k < $scope.schedules[i].days.length; k++){
                $scope.schedules[i].pretty_day = $scope.schedules[i].pretty_day + $scope.dayNumberToString($scope.schedules[i].days[k]);
              }
            }

        };


        var scheduleDataError = function(response) {
            console.log(response);
        };

        $scope.dayNumberToString = function(day_id) {
            return $scope.days[day_id].name;

        }


        $scope.dateStringToDateObj = function(dateString) {
          // Split timestamp into [ Y, M, D, h, m, s ]
          var t = dateString.split(/[- :]/);

          // Apply each element to the Date function
          var d = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));

    return(d);

        }


        $scope.showCreatePopup = function(ev) {
            $mdDialog.show({
                    controller: DialogController,
                    locals: {
                        parent: $scope
                    },
                    templateUrl: 'scheduling/createSchedule.tmpl.html',
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
            $scope.createSchedule = function(answer) {
                $scope.locals.createSchedule();
                $scope.cancel();
            };
        }

    }]);
