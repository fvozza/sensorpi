var express = require('express');
var Sensor = new require('./sensors.js').Sensor;
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

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
});

// Express stuff

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

// app.listen(8000); won't work with socket.io
server.listen(80);

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


// Socket.io stuff

io.sockets.on('connection', function (socket) {
  t1.on('data', function (sensor) {
    io.sockets.emit('sensordata', sensor);
  });
  socket.on('sensorupdated', function (sensor) {
    console.log("Sensor updated..");
  });
});
