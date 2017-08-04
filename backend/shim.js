// Ext Libs needed for the
var gpis = require('pi-gpio');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
// Build the express application

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.use(cors());


var Node = require('./node.js').Node;
var Zone = require('./zone.js').Zone;
var Schedule = require('./schedule.js').Schedule;
var SprinklerSystem = require('./sprinklerSystem.js').SprinklerSystem;
var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit: 10,
  host: '10.1.1.11',
  user: 'root',
  password: 'Goldenratio!6!8',
  database: 'cns'

});

var MASTER = 7;
var pinArray = [7, 11, 12, 13, 15, 16, 18, 22];

var initPins = function() {
    for (var i = 0; i < pinArray.length; i++) {
        gpio.open(pinArray[i], "output", function() {});
	console.log('inited pin' + str(pinArray[I]));
    };
};


// var pool = mysql.createPool({
//   connectionLimit: 10,
//   host: '127.0.0.1',
//   user: 'root',
//   password: 'Helloworld!6!8',
//   database: 'cns'
//
// });
var system = null;

app.listen(8080, function() {
    console.log('Example app listening on port 80!');
});



var rawNodeData = []
pool.query('SELECT * FROM nodes', function(err, rows, fields) {
  if (err) throw err;

// Build the system with the nodes
  system = new SprinklerSystem(rows, pool);

  // Build the zones
  pool.query('SELECT zones.id, zones.name, zones.location, zoneNodes.node_id FROM zones JOIN zoneNodes on zoneNodes.zone_id = zones.id', function(err, rows, fields) {
    if (err) throw err;

    var zoneObjects = buildZoneObject(rows)
    for (var key in zoneObjects){
      zoneObject = zoneObjects[key];
      // get the nodes ref for the system for each zone
      var nodes = []
      for(var j = 0; j < zoneObject.node_ids.length; j ++){
        nodes.push(system.getNodeById(zoneObject.node_ids[j]));
      }
      // create and add each zone to the system
      var zone = new Zone(zoneObject.id, zoneObject.name, zoneObject.location, nodes, pool);
      system.addZone(zone);

    }





  });


});


// Make an array of zone with there correspnding nodes
function buildZoneObject(zonesNodes) {
  console.log(zonesNodes);
  var zones = {};

  for(var i  = 0; i < zonesNodes.length; i++){
    var zone = zonesNodes[i];
    if(zones[zone.id]){
      // Exists, just add the node
      zones[zone.id].node_ids.push(zone.node_id)
    }
    else{
      var id = zone.node_id;
      delete zone.node_id;
      zone.node_ids = [];
      zone.node_ids.push(id);
      zones[zone.id] = zone;
    }
  }

return zones;
}



// API'S
// TODO: MOVE to seperate file


// Gets the info the all the nodes
app.get('/allNodeInfo', function(req, res) {

  res.json(system.getSystemNodeState());


});

// Get the info for a specific node
app.get('/nodeInfo', function(req, res) {
  var node_id = req.query.node_id;
  res.json(system.getNodeById(node_id)._jsonifyState());


});

// Set the status of node


app.post('/setNodeStatus', function(req, res) {
    var node_status = req.body.node_status;
    var node_id = req.body.node_id;
    if (node_status == "on") {
        system.getNodeById(node_id).on().then(function() {
            res.status(200);
            res.end();
        }).catch(e => console.log('something somewhere failed'));

    } else if(node_status == "off") {
      system.getNodeById(node_id).off().then(function() {
          res.status(200);
          res.end();
      }).catch(e => console.log('something somewhere failed'));

    }
    else if(node_status == "lock") {
      system.getNodeById(node_id)._lock().then(function() {
          res.status(200);
          res.end();
      }).catch(e => console.log('something somewhere failed'));

    }
    else if(node_status == "unlock") {
      system.getNodeById(node_id)._unlock().then(function() {
          res.status(200);
          res.end();
      }).catch(e => console.log('something somewhere failed'));

    }

});

// IF we manually turn a zone on or of without the lock being on, then the zone can
// change state from a schedule

// If the lock is on, then even the scehdules cant change its state


app.post('/setZoneStatus', function(req, res) {
  var zone_status = req.body.zone_status;
  var zone_id = req.body.zone_id;

  if(zone_status == "on"){
    system.getZoneById(zone_id).on().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));
  }
  else if (zone_status == "off") {
    system.getZoneById(zone_id).off().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));

  }
  else if (zone_status == "lock") {
    system.getZoneById(zone_id)._lock().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));

  }
  else if (zone_status == "unlock") {
    system.getZoneById(zone_id)._unlock().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));

  }
});



// COntrol the locking of a scedule. If a schedule, a program cannot change its state

app.post('/setScheduleStatus', function(req, res) {
  var schedule_status = req.body.schedule_status;
  var schedule_id = req.body.schedule_id;

   if (schedule_status == "lock") {
    system.getScheduleById(schedule_id)._lock().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));

  }
  else if (schedule_status == "unlock") {
    system.getScheduleById(schedule_id)._unlock().then(function() {
        res.status(200);
        res.end();
    }).catch(e => console.log('something somewhere failed'));

  }
});



// Get the staus of all the zones

app.get('/allZoneInfo', function(req, res) {
  res.json(system.getSystemZoneState());

});


// Create a zone


app.post('/createZone', function(req, res) {
    var zone_name = req.body.zone_name;
    var zone_location = req.body.zone_location;
    var zone_ids = req.body.zone_ids;
    // First get the node objects that are apart of new zone_id
    var nodes = [];
    for(var i = 0; i < zone_ids.length; i++){
      nodes.push(system.getNodeById(zone_ids[i]));
    }

    var zone = new Zone(null, zone_name, zone_location, nodes, pool);
    system.addZone(zone);
    res.json(zone._jsonifyState());



});


// Create a sceedule

app.post('/createSchedule', function(req, res) {
    var schedule_type = req.body.schedule_type;
    var associated_id = req.body.associated_id;
    var schedule_startdate = req.body.schedule_startdate;
    var schedule_enddate = req.body.schedule_enddate;
    var schedule_day = req.body.schedule_day;
    var schedule_freq = req.body.schedule_freq;
    var schedule_starttime = req.body.schedule_starttime;
    var schedule_length = req.body.schedule_length;
    var schedule_name = req.body.schedule_name;
    var schedule_onlength = req.body.schedule_onlength;
    var schedule_offlength = req.body.schedule_offlength;
    console.log(req);


    // Decide what object to attach the scedule to
    var controlObject = null;
    if(schedule_type == "Zone"){

      // get the zone
      controlObject = system.getZoneById(associated_id)
    }
    else{
      // Get the node
      controlObject = system.getNodeById(associated_id);
    }

    var newSchedule = new Schedule(schedule_name, null, schedule_startdate, schedule_enddate, schedule_starttime, null, schedule_onlength, schedule_offlength, schedule_length, schedule_day, controlObject, pool);
    newSchedule.saveSchedule().then(function() {
      for(var i = 0; i < newSchedule.scheduleDays.length; i++){
        var day = newSchedule.scheduleDays[i];
        day.saveScheduleDay();

      }
    });

    // Add the schedule to the control object array
    controlObject.schedules.push(newSchedule);

    res.json(controlObject._jsonifyState());
}.bind(this));

app.post('/deleteSchedule', function(req, res) {
    var schedule_id = req.body.schedule_id;
    console.log(schedule_id);
    var schedule = system.getScheduleById(schedule_id);
      schedule.destory();


});



app.get('/allSchedule', function(req, res) {
  res.json(system.getAllSchedules());
});

app.post('/updateSchedule', function(req, res) {
    var schedule_id = req.body.schedule_id;

    console.log(schedule_id);
    var schedule = system.getScheduleById(schedule_id);
    console.log(schedule);
    schedule._update(req.body.schedule_startdate, req.body.schedule_enddate,
      req.body.schedule_day, req.body.schedule_starttime,req.body.schedule_length,
      req.body.schedule_onlength, req.body.schedule_offlength).then(function () {
        res.status(200);
        res.end();
      }.bind(this))



});
