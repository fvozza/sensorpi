var express = require('express');
var Sensor = new require('./sensors.js').Sensor;
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

// Misc config variables
var port = 80;

io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

if ('development' == app.get('env')) {
  port = 8000;
  app.locals({
    development: true,
  });
}

// MongoDB stuff

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

var TemperatureSchema = new Schema({
  date:  Date,
  temp:  Number
});

mongoose.model('Temperature', TemperatureSchema);

var Temperature = mongoose.model('Temperature');

// Sensor stuff

var t1 = new Sensor('', 15*60*1000); // 15 min updates
t1.start();

t1.on('data', function (sensor) {
  new Temperature({date: sensor.date, temp: sensor.data}).save();
  io.sockets.emit('sensordata', sensor);
});

// Express stuff

server.listen(port);

app.use(express.logger({format: 'short'}));
app.use(express.errorHandler());
app.use(express.static(__dirname + '/'));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

// Routes

app.get('/', function (req, res, next) {
  res.render('root');
});


app.get('/temp', function (req, res) {
  Temperature.find({},'date temp -_id', function (err, results) {
    if (err) { 
      console.log(err);
      return;
    }
    res.send(results);
  });
});


// Push temperature upon socket.io connectin establishment

io.sockets.on('connection', function (socket) {  
  t1.pushUpdate();
});
