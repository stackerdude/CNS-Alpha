var nodeControl = require('./node-control');


function Node(id, gpio, name, location) {
  this.status = "off";
  this.id = id;
  this.gpio = gpio;
  this.name = name;
  this.location = location;
  this.lock = "off"

  // Returns a promise
  this.on = function() {
    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "on" || this.lock == "on") {
        resolve();
      } else {
        // Turn the pin on
        nodeControl.__singlePinOn_v2(this.gpio).then(function() {
          this.status = "on";
          // resolve the function
          resolve();
        })
      }
    });

  }
  this.off = function() {
    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "off") {
        resolve();
      } else {
        // Turn the pin on
        nodeControl.__singlePinOff_v2(this.gpio).then(function() {
          // resolve the function
          this.status = "off";
          resolve();
        })
      }
    });
  }
  this.lock = function() {
    return new Promise(function(resolve, reject) {
      // Check we arent already locked;
      if (this.lock == "on") {
        resolve();
      } else if (this.status == "on") {
        // Turn of then lock
        this.off.then(function() {
          // resolve the function
          this.lock = "on"
          resolve();
        })
      }

    });

    // Turn the node of then lock it

  }
  this.unlock = function() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "off") {
        resolve();
      } else {
        this.lock = "off";
        resolve();
      }
    });
  }
};

// NB: Locking a zone does not lock the nodes,
// This means that the nodes that belong to a zone can still fire
function Zone(name, location, nodes) {
  this.name = name;
  this.location = location;
  this.nodes = nodes;
  this.status = "off";
  this.lock = "off"

  this.on = function() {
    var promiseArray = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var p = node.on();
      promiseArray.push(p);
    }
    return Promise.all(promiseArray);
  }
  this.off = function() {
    var promiseArray = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var p = node.off();
      promiseArray.push(p);
    }
    return Promise.all(promiseArray);
  }


  this.lock = function() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "on") {
        resolve();
      } else {
        this.lock = "on";
        resolve();
      }
    });
  }
  this.unlock = function() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "off") {
        resolve();
      } else {
        this.lock = "off";
        resolve();
      }
    });
  }

};



function Schedule(startDate, endDate, startTime, endTime, onLength, offLength, length, days, target) {
  this.startDate = startDate;
  this.endDate = endDate;
  this.startTime = startTime;
  this.endTime = endTime;
  this.onLength = onLength;
  this.offLength = offLength;
  this.length = length
  this.days = days;
  this.target = target; // Pointer to either a Zone or a nodes
  this.sceduleObjects = list();
  this.status = "off"
  this.lock = "off";


  this.on = function() {

    return new Promise(function(resolve, reject) {
      // Check this pin isnt already on
      if (this.status == "on" || this.lock == "on") {
        resolve();
      } else {
        // Turn the pin on
        this.target.on().then(function() {
          this.status = "on";
          // resolve the function
          resolve();
        })
      }
    });

  }
  this.off = function() {
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
        })
      }
    });
  }

  this.pause = function() {

  }

  this.unpause = function() {

  }

  this.lock = function() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "on") {
        resolve();
      } else {
        this.lock = "on";
        resolve();
      }
    });
  }
  this.unlock = function() {
    return new Promise(function(resolve, reject) {

      if (this.lock == "off") {
        resolve();
      } else {
        this.lock = "off";
        resolve();
      }
    });
  }

  // Update the DB record
  this.update = function() {}
}


// Bulids the schedule from the localvars

this.buildScheduleObject = function(){
  var cycleLength = parseInt(this.onlength) + parseInt(this.offlength);
  var numberOfCycles = Math.floor(parseInt(this.length) / cycleLength);
  var timeArray = timeStringToArray(this.startTime);

  //Time config objects

  var timeConfig = {};
  timeConfig.dayOfWeek = parseInt(scheduleObject.days);
  timeConfig.start = this.startDate;
  timeConfig.end = this.endDate;

  // Build an object for each cycle
  for (var k = 0; k < numberOfCycles; k++) {
      var offsetTimeArray = addMinsToTimeArray(timeArray, k * cycleLength);
      timeConfig.hour = parseInt(offsetTimeArray[0]);
      timeConfig.minute = parseInt(offsetTimeArray[1]);
      timeConfig.second = parseInt(offsetTimeArray[2]);

      var j = schedule.scheduleJob(timeConfig, function(timeConfig) {
        console.log(timeConfig);
          console.log('Power Zone On' + timeConfig.gpio);
          console.log(timeConfig);

          nodeControl.pinOn(timeConfig.gpio);
      }.bind(null,timeConfig));

      this.scheduleObjects.push(j);
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
      this.scheduleObjects.push(q);


    }



}



//
var timeStringToArray = function(timeString) {
    // Split timestamp into [h, m, s ]
    var t = timeString.split(/[:]/);
    t[0] = parseInt(t[0]);
    t[1] = parseInt(t[1]);
    t[2] = parseInt(t[2]);

    return t;

};
