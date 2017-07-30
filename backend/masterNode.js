var gpio = require("pi-gpio");
class MasterNode {
  constructor(id, gpio, name, location, pool, sprinklerSystem) {
    this.status = "off";
    this.id = id;
    this.gpio = gpio;
    this.name = name;
    this.location = location;
    this.lock = "off"
    this.connectionPool = pool
    this.sprinklerSystem = sprinklerSystem;
    console.log("Initilized the master node");

  }

  on() {
    return new Promise(function(resolve, reject) {

      // If it on leave it, if its off turn it on
      if (this.status == 'on') {
        console.log("Master Node Already On");
        resolve();
      } else {
        console.log("Turning Master Node  " + this.id + ":" + this.name + " On");
          gpio.write(this.gpio, 1, function() {
              console.log(this.gpio + "MASTER turned On");
              console.log("## _pinOn resolve");
              this.status = 'on';
              resolve()
          }.bind(this));
      }


    }.bind(this))
  }

  off() {
    return new Promise(function(resolve, reject) {
      // Check to see if mater is defined
        /// IF off, eav it off, else turn and on, then make sure
        if (this.status == 'off') {
          console.log("Master Node Already Off");

          resolve();
        } else {
          // Check that there are no over nodes on, if there are dont turn it off
          // If we are the only node on, the we can turn that mater off
          // Check to see if we are the only node on by useing a counter
          // If counter is greater then 1, dont turn the master off
          var onCount = 0;
          var nodes = this.sprinklerSystem.nodes;

          for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.status == 'on') {
              // A node is using it, dont turn of maters
              onCount ++;

            }
          }
          if(onCount > 1){
            // Dont turn of master
            resolve();
            return;

          }
          // Getting to here means that there are no other node on, we can safely turn of the master;
          console.log("Turning Master Node  " + this.id + ":" + this.name + " Off");
          gpio.write(this.gpio, 0, function() {
          	this.status = "off";
          	resolve();
          }.bind(this));

        }

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

    return object;


      }



}

module.exports.MasterNode = MasterNode;
