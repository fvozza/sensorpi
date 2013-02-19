
  $(document).ready(function() {
    initNavbar();
    ioSocketInit();
    initChart();
  });
  
  function initNavbar() {
    $("nav").click(function(e) {
      if (e.target.id != "temp") {
        e.currentTarget.getElementsByClassName("active")[0].className = "";
        e.target.className = "active";
      }
    });
  }

  function ioSocketInit() {
    if (development == true) 
      var socket = io.connect('http://localhost');
    else
      var socket = io.connect('http://zi0n.no-ip.org');
    socket.on('sensordata', function (sensor) {
      $("#temp a").text(sensor.data.toString());
      //socket.emit('sensorupdated', { sensor: sensor });
    });
  }
  
  function initChart() {
    $.getJSON('/temp', function(data) {
      chartdata = data.map(function(item) {
        return [Date.parse(item.date), item.temp];
      });
      var tempChart = new Highcharts.Chart({
          chart: {
              renderTo: 'chart',
              type: 'line'
          },
          xAxis: {
              type: 'datetime'
          },
          title: {
              text: 'Temperature'
          },
          legend: {
            enabled: false
          },
          series: [{
              name: 'Temperature',
              data: chartdata
          }]
      });  
    });
  };