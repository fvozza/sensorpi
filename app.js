var express = require('express');
var Sensor = new require('./sensors.js').Sensor;

var t1 = new Sensor('', 3000);
t1.start();

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

app.get('/', function (req, res, next) {
  res.render('root');
});

/* Replace this with socket.io */
app.get('/temp', function (req, res) {
  res.send({
    'temp': t1.read().toFixed(2).toString(),
  });
});

io.sockets.on('connection', function (socket) {
  t1.on('data', function (sensor) {
    io.sockets.emit('sensordata', sensor);
  });
  socket.on('sensorupdated', function (sensor) {
    console.log("Sensor updated..");
  });
});


