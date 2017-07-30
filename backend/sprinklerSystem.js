var Node = require('./node.js').Node;
var MasterNode = require('./masterNode.js').MasterNode;


class SprinklerSystem {
  constructor(rawNodeData, connectionPool) {
    this.rawNodeData = rawNodeData;
    this.connectionPool = connectionPool;
    this.nodes = [];
    this.zones = []
    this.masterNode = null;


    this._buildNodes();

  }

  getNodeById(id) {

    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      if (node.id == id) {
        return node;
      }
    }
  }

  getZoneById(id) {
    for (var i = 0; i < this.zones.length; i++) {
      var zone = this.zones[i];
      if (zone.id == id) {
        return zone;
      }
    }

  }

  getScheduleById(id){
    var allSchedules = this._getAllSchedules();
    for(var i =0; i < allSchedules.length; i++){
      var schedule = allSchedules[i];
      if(schedule.id == id){
        return schedule;
      }
    }
  }

  // Return the actually schedule call object;

  _getAllSchedules(){
    var schedules = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      node.schedules.map(function(val) {
        schedules.push(val);
      });

    };

    for (var i = 0; i < this.zones.length; i++) {
      var zone = this.zones[i];
      zone.schedules.map(function(val) {
        schedules.push(val);

      })
    }

    return schedules;
  }

  getAllSchedules() {
    var schedules = [];
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      node.schedules.map(function(val) {
        var obj = val._jsonifyState();
        obj.target = val._jsonifyState();
        schedules.push(obj);
      });

    };
    for (var i = 0; i < this.zones.length; i++) {
      var zone = this.zones[i];
      zone.schedules.map(function(val) {
        var obj = val._jsonifyState();
        obj.target = val._jsonifyState();
        schedules.push(obj);

      })
    }
    return schedules;
  }

  _buildNodes() {

    for (var i = 0; i < this.rawNodeData.length; i++) {
      //constructor(id, gpio, name, location) {
      var data = this.rawNodeData[i];
      if (data.id == 7) {
        this._buildMasterNode(data);
      } else {
        var newNode = new Node(data.id, data.gpio, data.name, data.location, this.connectionPool, this);
        this.nodes.push(newNode)
      }

    }
  }

  _buildMasterNode(data) {
    var masterNode = new MasterNode(data.id, data.gpio, data.name, data.location, this.connectionPool, this);
    this.masterNode = masterNode;
  }

  addZone(zone) {
    this.zones.push(zone);
  }
  // Gets the state of each node in the system


  getSystemNodeState() {
    var systemState = []
    for (var idx in this.nodes) {
      var node = this.nodes[idx];
      systemState.push(node._jsonifyState());
    }
    systemState.push(this.masterNode._jsonifyState());

    return systemState;
  }

  // Gets the state of each Zone in the system


  getSystemZoneState() {
    var systemState = []
    for (var idx in this.zones) {
      var zone = this.zones[idx];
      systemState.push(zone._jsonifyState());
    }

    return systemState;
  }

}


module.exports.SprinklerSystem = SprinklerSystem;
