var Schedule = require('./schedule.js').Schedule;
class Zone {
  constructor(id, name, location, nodes, pool) {
    this.id = id
    this.name = name;
    this.location = location;
    this.nodes = nodes;
    this.status = "off";
    this.lock = "off"
    this.connectionPool = pool;
    this.type = "Zone";
    this.schedules = [];

    // Check if the id is null, if so its a creation case, handle it
    // else check if there are schedules for the zone

    if (this.id == null) {
      // Handle Save
      this._saveZone()
    } else {
      // Check scehdules

      this._getSchedule();
    }
  }


  // NB: Locking a zone does not lock the nodes,
  // This means that the nodes that belong to a zone can still fire


  on() {
    // Check to see if the zone is locked, if it is do nothing
    if (this.lock == "on") {
      return new Promise(function(resolve, reject) {
        resolve();
      })
    }
    var promiseArray = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var p = node.on();
      promiseArray.push(p);
    }
    // promise to change the zone status
    var zoneStatusSwap = new Promise(function(resolve, reject) {
      this.status = 'on';
    }.bind(this));
    promiseArray.push(zoneStatusSwap)

    return Promise.all(promiseArray);
  }
  off() {
    // Check to see if the zone is locked, if it is do nothing
    if (this.lock == "on") {
      return new Promise(function(resolve, reject) {
        resolve();
      })
    }

      var promiseArray = [];
      for (var i = 0; i < this.nodes.length; i++) {
        var node = this.nodes[i];
        var p = node.off();
        promiseArray.push(p);
      }

      // promise to change the zone status
      var zoneStatusSwap = new Promise(function(resolve, reject) {
        this.status = 'off';
      }.bind(this));
      promiseArray.push(zoneStatusSwap)
      return Promise.all(promiseArray);
    }


  //Called after a schedule update are Made
  // Turns all node off, then clears the schedule, then rebuilds it

  _rebuildSchedule() {
    this.off().then(function() {
      for (var i = 0; i < this.schedules; i++) {
        var schedule = this.schedules[i];
        schedule.cancel();
      }
      // Remove the references
      this.schedules = [];
      // Rebuild the schedules
      this._getSchedule();

    }.bind(this))
  }


  _lock() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "on") {
        resolve();
      } else {
        this.lock = "on";
        resolve();
      }
    });
  }
  _unlock() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "off") {
        resolve();
      } else {
        this.lock = "off";
        resolve();
      }
    });
  }


  _getSchedule() {
    // Get the schedule with the days
    var query = 'SELECT schedule.id, schedule.type, schedule.associated_id, \
    schedule.startdate, schedule.enddate, schedule.day, schedule.freq, \
    schedule.starttime, schedule.length, schedule.onlength, schedule.offlength, \
    schedule.name, scheduleDays.dayOfWeek, \
    scheduleDays.id AS scheduleDays_id, DATE_FORMAT(startdate,"%d/%m/%Y") \
    AS pretty_startdate, DATE_FORMAT(enddate,"%d/%m/%Y") AS pretty_enddate \
    FROM schedule LEFT JOIN scheduleDays on \
     schedule.id=scheduleDays.schedule_id WHERE schedule.type = \'Zone\' \
     AND associated_id = ?'
    this.connectionPool.query(query, [this.id], function(err, rows, fields) {
      if (err) throw err;
      var schedules = {};
      // Tuen into a nested obj with the days being a elements if the sceedule

      for (var i = 0; i < rows.length; i++) {
        var schedule = rows[i];

        if (schedules[schedule.id]) {
          // Exists
          schedules[schedule.id].scheduleDays.push(schedule.dayOfWeek);

        } else {
          //  create
          var temp = schedule.dayOfWeek
          delete schedule.dayOfWeek;
          schedule.scheduleDays = [];
          schedule.scheduleDays.push(temp);
          schedules[schedule.id] = schedule;


        }

      }

      //  Init a sceedule for each entry
      for (var key in schedules) {
        var obj = schedules[key];
        console.log(obj);
        var newSchedule = new Schedule(obj.name, obj.id, obj.startdate, obj.enddate, obj.starttime, obj.endtime, obj.onlength, obj.offlength, obj.length, obj.scheduleDays, this, this.connectionPool);
        console.log(newSchedule);
        this.schedules.push(newSchedule);
      }

      console.log(schedules);
    }.bind(this));

  }


  _jsonifyState() {
    var object = {};

    object.id = this.id;
    object.name = this.name;
    object.location = this.location;
    object.status = this.status;
    object.lock = this.lock;
    object.nodes = [];
    object.schedules = []


    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var nodeJson = node._jsonifyState();
      object.nodes.push(nodeJson);
    }

    for (var i = 0; i < this.schedules.length; i++) {
      var schedule = this.schedules[i];
      object.schedules.push(schedule._jsonifyState());

    }



    return object;


  }

  _saveZone() {
    this.connectionPool.query('INSERT INTO zones (name, location, status) VALUES (?,?,?)', [this.name, this.location, 'off'], function(err, rows, fields) {
      if (err) {
        console.log(err);
      } else {
        this.id = rows.insertId;
        var insertPayload = [];
        for (var i = 0; i < this.nodes.length; i++) {
          var currentRecord = [rows.insertId, this.nodes[i].id];
          insertPayload.push(currentRecord);
        }

        this.connectionPool.query('INSERT INTO zoneNodes (zone_id, node_id) VALUES ?', [insertPayload], function(err, rows, fields) {
          if (err) {
            console.log(err)
          } else {
            console.log(rows);
            this.id = rows.insertId;

          }

        }.bind(this));
      }
    }.bind(this));
  }




}


module.exports.Zone = Zone;
