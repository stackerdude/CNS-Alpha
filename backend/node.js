var gpio = require("pi-gpio");
var Schedule = require('./schedule.js').Schedule;
class Node {
  constructor(id, gpio, name, location, pool, sprinklerSystem) {
    this.status = "off";
    this.id = id;
    this.gpio = gpio;
    this.name = name;
    this.location = location;
    this.lock = "off"
    this.connectionPool = pool
    this.schedules = [];
    this.type = "Node";
    this.sprinklerSystem = sprinklerSystem;

    this._getSchedule();
    console.log("Made node " + this.id);
  }
  // Returns a promise
  on() {
    return new Promise(function(resolve, reject) {
      // Check to see if the node is locked
      // Check this pin isnt already on
      if (this.lock == "on") {
        console.log("Node" + this.id + ":" + this.name  + " already on");
        resolve();
      }
      else if( this.lock == "on"){
        console.log("Node" + this.id + ":" + this.name  + " is locked");
        resolve();
      }
      else {
        // Turn on master, then turn on the pin
        this.sprinklerSystem.masterNode.on().then(function(){
          console.log("Turning node " + this.id + ":" + this.name + "On");
          //  nodeControl.__singlePinOn_v2(this.gpio).then(function() {
          //     this.status = "on";
          //     // resolve the function
          //     resolve();
          //   });

          gpio.write(this.gpio, 1, function() {
              console.log(this.gpio + " turned On");
              console.log("## _pinOn resolve");
              this.status = 'on';
              resolve()
          }.bind(this));



        }.bind(this));
        // Turn the pin on
      resolve();
      }
    }.bind(this));
  }
  off() {
    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "off") {
        console.log("Node" + this.id + ":" + this.name  + " already off ");
        resolve();
      }
      else if (this.lock == "on"){
        console.log("Node" + this.id + ":" + this.name  + "is locked");
        resolve();
      }
      else {
        // Turn the pin on
        this.sprinklerSystem.masterNode.off().then(function(){
          console.log("Turning node " + this.id + ":" + this.name + "Off");

          gpio.write(this.gpio, 0, function() {
          	this.status = "off";
          	resolve();
          }.bind(this));

        }.bind(this));



      }
    }.bind(this));
  }
  _lock() {
    return new Promise(function(resolve, reject) {
      // Check we arent already locked;
      if (this.lock == "on") {
        resolve();
      }
      else{
        this.lock = "on"
        resolve();
      }

    }.bind(this));

    // Turn the node of then lock it

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

  _getSchedule(){

    // Get the schedule with the days
    var query = 'SELECT schedule.id, schedule.type, schedule.associated_id, \
    schedule.startdate, schedule.enddate, schedule.day, schedule.freq, \
    schedule.starttime, schedule.length, schedule.onlength, schedule.offlength, \
    schedule.name, zoneNodes.node_id, nodes.gpio, scheduleDays.dayOfWeek, \
    scheduleDays.id AS scheduleDays_id, DATE_FORMAT(startdate,"%d/%m/%Y") \
    AS pretty_startdate, DATE_FORMAT(enddate,"%d/%m/%Y") AS pretty_enddate \
    FROM schedule LEFT JOIN zoneNodes ON schedule.associated_id=zoneNodes.zone_id\
     LEFT JOIN nodes ON zoneNodes.node_id=nodes.id LEFT JOIN scheduleDays on \
     schedule.id=scheduleDays.schedule_id WHERE schedule.type = \'Node\' \
     AND associated_id = ?'
     this.connectionPool.query(query, [this.id],  function(err, rows, fields) {
         if (err) throw err;
         var schedules = {};
         // Tuen into a nested obj with the days being a elements if the sceedule

         for(var i = 0; i < rows.length; i++){
           var schedule = rows[i];

           if(schedules[schedule.id]){
             // Exists
             schedules[schedule.id].scheduleDays.push(schedule.dayOfWeek);

           }
           else{
            //  create
            var temp = schedule.dayOfWeek
            delete schedule.dayOfWeek;
            schedule.scheduleDays = [];
            schedule.scheduleDays.push(temp);
            schedules[schedule.id] = schedule;


           }

         }

        //  Init a sceedule for each entry
        for (var key in schedules){
          var obj = schedules[key];
          console.log(obj);
          var newSchedule = new Schedule(obj.name,  obj.id,  obj.startdate, obj.enddate, obj.starttime, obj.endtime, obj.onlength, obj.offlength, obj.length, obj.scheduleDays, this, this.connectionPool);
          console.log(newSchedule);
          this.schedules.push(newSchedule);
        }

      console.log(schedules);
    }.bind(this));


  }

  _jsonifyState(){
    var object = {};
    object.status = this.status;
    object.id = this.id;
    object.gpio = this.gpio;
    object.name = this.name;
    object.location = this.location;
    object.lock = this.lock;
    object.schedules = [];

    for(var i = 0; i < this.schedules.length; i++){
      var schedule = this.schedules[i];
      object.schedules.push(schedule._jsonifyState());

    }


return object;


  }




}


module.exports.Node = Node;
