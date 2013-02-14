/*
  Sensor class abstracting a single DS18B20 1-wire sensor
  directly connected on the GPIO bus
*/

var util = require("util"),
    events = require("events"),
    fs = require('fs');

var sensor_path = "/sys/bus/w1/devices/w1_bus_master1/28-0000045885ef/";
//var sensor_path = "./28-0000045885ef/";  // test path

// Class for a OWFS Sensor
function Sensor(interval) {
  interval = interval || 1000;  // sensor polling interval

  events.EventEmitter.call(this);
  this.data = 0;
  this.date = undefined;
  this.interval = interval;
  this.name = undefined;

  // Bind this to self in order to access it in closures ()
  // See: http://stackoverflow.com/questions/9270079/structuring-a-nodejs-module-variables-and-methods
  self = this; 
  
  // Read sensor name 
  fs.readFile(sensor_path + 'name', 'utf-8', function (err, data) {
    if (err) throw err;
    self.name = data.toString().slice(0, -1);
  });
}

// Inherits from EvenEmitter
// See: http://nodejs.org/api/modules.html#modules_module_exports
util.inherits(Sensor, events.EventEmitter);

// Add functions to the prototype of the class

// Starts polling and emit 'data' event when new data is available
Sensor.prototype.start = function() {
  this.intervalId = setInterval(function () {
    fs.readFile(sensor_path + 'w1_slave', function (err, data) {
      try {
      self.data = parseTemp(data.toString());
      } catch (error) {
        console.log(error);
        self.data = 0;
      }
      self.date = new Date().toISOString();
      self.emit('data', self);
    });
  }, this.interval);
}

// Stops polling
Sensor.prototype.stop = function () {
  clearInterval(this.intervalId);
}

// Read the latest sensor value
Sensor.prototype.read = function () {
  return this.data;
}

/* Example 1-wire data:
95 01 4b 46 7f ff 0b 10 0b : crc=0b YES
95 01 4b 46 7f ff 0b 10 0b t=25312
*/
function parseTemp(data) {
  crc = data.match(/.*crc=(\w\w)\s(YES|NO)/)[2];
  if (crc != 'YES') throw "Error reading sensor. Bad CRC!";
  temp = data.match(/.*t=(.*)/)[1];
  return temp/1000;
}

exports.Sensor = Sensor;

/*

Usage:

var Sensor = new require('./sensors.js').Sensor;
var t1 = new Sensor();

*/
