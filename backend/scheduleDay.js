var schedule = require('node-schedule');
class ScheduleDay {

  // When we need to access other schedule properties, we look up at the parent schedule object
  constructor(day, schedule, connectionPool) {
    this.day = day;
    this.schedule = schedule;
    this.scheduleObjects = [];
    this.connectionPool = connectionPool;
    this._buildScheduleObjects()

  }


  _getRawSchedule() {

  }


  _buildScheduleObjects() {

    // Caclulate the length of a full cycle (ontime + offime)

    var cycleLength = parseInt(this.schedule.onLength) + parseInt(this.schedule.offLength);

    // Calculate the number of cycles (assume its an interger)
    // TODO: Enforce length / (cycleLength) is an interger
    var numberOfCycles = Math.floor(parseInt(this.schedule.length) / cycleLength);
    var timeArray = this.timeStringToArray(this.schedule.startTime);

    //Time config objects

    var timeConfig = {};
    timeConfig.dayOfWeek = parseInt(this.day);
    timeConfig.start = this.schedule.startDate;
    timeConfig.end = this.schedule.endDate;



    // Build an object for each cycle
    for (var k = 0; k < numberOfCycles; k++) {
      var offsetStartTimeArray = this.addMinsToTimeArray(timeArray, k * cycleLength);
      timeConfig.hour = parseInt(offsetStartTimeArray[0]);
      timeConfig.minute = parseInt(offsetStartTimeArray[1]);
      timeConfig.second = parseInt(offsetStartTimeArray[2]);

      var j = schedule.scheduleJob(timeConfig, function(scheduleDay) {
        console.log('Powering ' + " " + scheduleDay.schedule.target.constructor.name + " " + 'On ' + scheduleDay.schedule.target.name);
        scheduleDay._powerTargetOn();
      }.bind(null, this));

      this.scheduleObjects.push(j);
      var offsetEndTimeArray = this.addMinsToTimeArray(timeArray, (k * cycleLength) + parseInt(this.schedule.onLength));
      timeConfig.hour = parseInt(offsetEndTimeArray[0]);
      timeConfig.minute = parseInt(offsetEndTimeArray[1]);
      timeConfig.second = parseInt(offsetEndTimeArray[2]);
      var q = schedule.scheduleJob(timeConfig, function(scheduleDay) {
        console.log('Powering ' + " " + scheduleDay.schedule.target.constructor.name + " " + 'Off ' + scheduleDay.schedule.target.name);
        scheduleDay._powerTargetOff();
      }.bind(null, this));
      this.scheduleObjects.push(q);


    }
  }

  _powerTargetOn() {
    this.schedule.on();
  }

  _powerTargetOff() {
    this.schedule.off();
  }

  timeStringToArray(timeString) {
    // Split timestamp into [h, m, s ]
    var t = timeString.split(/[:]/);
    t[0] = parseInt(t[0]);
    t[1] = parseInt(t[1]);
    t[2] = parseInt(t[2]);

    return t;
  }

  addMinsToTimeArray(timeArray, offset) {
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
  saveScheduleDay() {

    this.connectionPool.query('INSERT INTO scheduleDays (dayOfWeek, schedule_id) VALUES (?,?)', [this.day, this.schedule.id], function(err, rows, fields) {
      if (err) {
        console.log(err);
      } else {
        console.log(rows);
        this.id = rows.insertId;


      }
    });
  }

  destory(){
    // Delete all the schdule objects to they dont fire

    for(var i = 0; i < this.scheduleObjects.length; i++){
      var scheduleObject = this.scheduleObjects[i];
      scheduleObject.cancel();

    }
    return new Promise(function(resolve, reject) {
      this.connectionPool.query('DELETE FROM scheduleDays WHERE schedule_id=?', [this.id], function(err, rows, fields) {
          if (err) {
            reject();
          } else {
            // remove the schedule for the target

            this
            resolve();
          }

      });
    }.bind(this));
  }


}


module.exports.ScheduleDay = ScheduleDay;
