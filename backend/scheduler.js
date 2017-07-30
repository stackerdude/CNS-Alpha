var schedule = require('node-schedule');
var nodeControl = require('./node-control');
const util = require('util');


var scheduleObjectArray = [];




var createStaticSchedule = function(scheduleObject) {
    // Split the time string into hr, mins and seconds
    var timeArray = timeStringToArray(scheduleObject.starttime);
    console.log(timeArray);
    var startDateObject = scheduleObject.startdate;
    var endDateObject = scheduleObject.enddate;
    // Buiild the time config object
    var timeConfig = {};
    timeConfig.hour = parseInt(timeArray[0]);
    timeConfig.minute = parseInt(timeArray[1]);
    timeConfig.second = parseInt(timeArray[2]);
    timeConfig.dayOfWeek = parseInt(scheduleObject.dayOfWeek);
    timeConfig.start = startDateObject;
    timeConfig.end = endDateObject;
    console.log(timeConfig);

    // Create Power on Job
    var j = schedule.scheduleJob(timeConfig, function() {
        console.log('Power Zone On');
    }.bind(null, timeConfig));

    // Config the time object for power off
    var hourLength = Math.floor(parseInt(scheduleObject.length) / 60);
    var minLength = (scheduleObject.length) % 60;

    timeConfig.hour += hourLength;
    timeConfig.minute += minLength;
    console.log(timeConfig);
    // Create Power Off Job
    var k = schedule.scheduleJob(timeConfig, function() {
        console.log('Power Zone Of');
    }.bind(null,timeConfig));


};

var createStaggeredSchedule = function(scheduleObjects, pool) {
  // Clear the system if any old scheduleObjects
  // TODO: Compute the delta state rather then throwing away all objects
  for (var k = 0; k < scheduleObjectArray.length; k++){
    var obj = scheduleObjects[k]
    obj.cancel();
    console.log("Deleted");
  }
    for (var i = 0; i < scheduleObjects.length; i++) {
        var scheduleObject = JSON.parse(JSON.stringify(scheduleObjects[i]))
        var startDateObject = scheduleObject.startdate;
        var endDateObject = scheduleObject.enddate;
        var cycleLength = parseInt(scheduleObject.onlength) + parseInt(scheduleObject.offlength);
        var numberOfCycles = Math.floor(parseInt(scheduleObject.length) / cycleLength);
        var timeArray = timeStringToArray(scheduleObject.starttime);
        var timeConfig = {};
        timeConfig.dayOfWeek = parseInt(scheduleObject.dayOfWeek);
        timeConfig.start = startDateObject;
        timeConfig.end = endDateObject;

        for (var k = 0; k < numberOfCycles; k++) {
            var offsetTimeArray = addMinsToTimeArray(timeArray, k * cycleLength);
            timeConfig.hour = parseInt(offsetTimeArray[0]);
            timeConfig.minute = parseInt(offsetTimeArray[1]);
            timeConfig.second = parseInt(offsetTimeArray[2]);
            timeConfig.gpio = scheduleObject.gpio
            var gpio = JSON.parse(JSON.stringify(scheduleObject.gpio));
            console.log(timeConfig);
            var j = schedule.scheduleJob(timeConfig, function(timeConfig) {
              console.log(timeConfig);
                console.log('Power Zone On' + timeConfig.gpio);
                console.log(timeConfig);

                nodeControl.pinOn(timeConfig.gpio);
            }.bind(null,timeConfig));
            scheduleObjectArray.push(j);
            offsetTimeArray = addMinsToTimeArray(timeArray, (k * cycleLength) + parseInt(scheduleObject.onlength));
            timeConfig.hour = parseInt(offsetTimeArray[0]);
            timeConfig.minute = parseInt(offsetTimeArray[1]);
            timeConfig.second = parseInt(offsetTimeArray[2]);

            var q = schedule.scheduleJob(timeConfig, function(timeConfig) {
              console.log(timeConfig);
                console.log('Power Zone Off' + timeConfig.gpio);
                console.log(timeConfig);
                nodeControl.pinOff(timeConfig.gpio)
            }.bind(null,timeConfig));
            scheduleObjectArray.push(q);
        }
        // Check to see if there is remaining time eg 33 min length 5 on 5 off means we have 3 mins on left to schedule

        if (cycleLength * numberOfCycles != scheduleObject.length) {
            offsetTimeArray = addMinsToTimeArray(timeArray, cycleLength * numberOfCycles);
            timeConfig.hour = parseInt(offsetTimeArray[0]);
            timeConfig.minute = parseInt(offsetTimeArray[1]);
            timeConfig.second = parseInt(offsetTimeArray[2]);

            console.log("Start Time Remainder Config " + util.inspect(timeConfig, false, null));

            offsetTimeArray = addMinsToTimeArray(timeArray, scheduleObject.length);
            timeConfig.hour = parseInt(offsetTimeArray[0]);
            timeConfig.minute = parseInt(offsetTimeArray[1]);
            timeConfig.second = parseInt(offsetTimeArray[2]);

            console.log("End Time Remainder Config" + util.inspect(timeConfig, false, null));

        }

        console.log("Final");
        console.log(timeConfig);
    }


}


var addMinsToTimeArray = function(timeArray, offset) {
    var offSetHours = Math.floor(offset / 60);
    var offSetMins = offset % 60;

    var offsetTimeArray = [];

    offsetTimeArray[0] = timeArray[0] + offSetHours;
    offsetTimeArray[1] = timeArray[1] + offSetMins;
    offsetTimeArray[2] = timeArray[2];
    // Make sure minues is not greater then 60
    if (offsetTimeArray[1] >= 60) {
        offsetTimeArray[0] += Math.floor(offsetTimeArray[1] / 60);
        offsetTimeArray[1] = offsetTimeArray[1] % 60;
    }

    return offsetTimeArray;


}

var timeStringToArray = function(timeString) {
    // Split timestamp into [ Y, M, D, h, m, s ]
    var t = timeString.split(/[:]/);
    t[0] = parseInt(t[0]);
    t[1] = parseInt(t[1]);
    t[2] = parseInt(t[2]);

    return t;

};


module.exports.createStaticSchedule = createStaticSchedule;
module.exports.createStaggeredSchedule = createStaggeredSchedule;
