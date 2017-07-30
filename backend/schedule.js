var ScheduleDay = require('./scheduleDay.js').ScheduleDay;
class Schedule {
  constructor(name, id, startDate, endDate, startTime, endTime, onLength, offLength, length, days, target, connectionPool) {
    this.id = id
    this.name = name;
    this.startDate = startDate;
    this.endDate = endDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.onLength = onLength;
    this.offLength = offLength;
    this.length = length
    this.days = days;
    this.target = target; // Pointer to either a Zone or a nodes
    this.scheduleDays = []
    this.status = "off"
    this.lock = "off";
    this.connectionPool = connectionPool


    // Build ScheduleDay for this Schedule
    for (var day in this.days) {
      var dayNumber = this.days[day];
      var daySchedule = new ScheduleDay(dayNumber, this, this.connectionPool);
      this.scheduleDays.push(daySchedule);
    }




  }

  on() {

    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "on" || this.lock == "on") {
        console.log("Can't turn schedule on: Lock is on");
        resolve();
      } else {
        // Turn the pin on
        this.target.on().then(function() {
          this.status = "on";
          // resolve the function
          resolve();
        }.bind(this))
      }
    }.bind(this));

  }

  off() {
    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "off") {
        resolve();
      } else {
        // Turn the pin on
        this.target.off().then(function() {
          // resolve the function
          this.status = "off";
          resolve();
        }.bind(this))
      }
    }.bind(this));
  }

  pause() {

  }

  unpause() {

  }

  _lock() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "on") {
        resolve();
      } else {
        this.lock = "on";
        resolve();
      }
    }.bind(this));
  }

  _unlock() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "off") {
        resolve();
      } else {
        this.lock = "off";
        resolve();
      }
    }.bind(this));
  }

  // Update the DB record
  update() {}

  _jsonifyState() {
    var obj = {};
    obj.name = this.name;
    obj.id = this.id;
    obj.startDate = this.startDate;
    obj.endDate = this.endDate;
    obj.startTime = this.startTime;
    obj.endTime = this.endTime;
    obj.onLength = this.onLength;
    obj.offLength = this.offLength;
    obj.length = this.length;
    obj.status = this.status;
    obj.lock = this.lock;
    obj.days = []
    // Get the days

    for (var i = 0; i < this.scheduleDays.length; i++) {
      var scheduleDay = this.scheduleDays[i];
      obj.days.push(scheduleDay.day);


    }

    return obj


  }

  saveSchedule() {
    return new Promise(function(resolve, reject) {

      var query = "INSERT INTO schedule (type, associated_id, startdate, enddate, freq, starttime, length, name, onlength, offlength) VALUES (?,?,?,?,?,?,?,?,?,?)";
      var values = [this.target.type, this.target.id, this.startDate, this.endDate, 'del', this.startTime, this.length, this.name, this.onLength, this.offLength];
      console.log(values);
      this.connectionPool.query(query, values, function(err, rows, fields) {
        if (err) {
          console.log(err);
          reject()
        } else {
          console.log(rows);
          // Save the creted id to the record

          this.id = rows.insertId;
          resolve()
        }

      }.bind(this));

    }.bind(this));

  }

  destory() {
    // delete all days then delete the schedule
    var promiseArray = [];
    for (var i = 0; i < this.scheduleDays.length; i++) {
      var daySchedule = this.scheduleDays[i];
      promiseArray.push(daySchedule.destory());
    }

    Promise.all(promiseArray).then(function() {
      var query = "DELETE FROM schedule WHERE id=?";
      this.connectionPool.query(query, [this.id], function(err, rows, fields) {
        if (err) {
          console.log(err);
        } else {
          console.log(rows);
          var index = this.target.schedules.indexOf(this);
          this.target.schedules.splice(index, 1);
        }
      }.bind(this));
    }.bind(this))
  }

}

module.exports.Schedule = Schedule;
