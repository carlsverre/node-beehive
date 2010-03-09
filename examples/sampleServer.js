require.paths.unshift(__dirname + '/../lib');
require.paths.unshift(__dirname + '/Long-Polling-Buffer/lib');
require.paths.unshift(__dirname + '/express/lib');
require('express');
require('express/plugins');
require('node-beehive');

var lpb = require('longpollingbuffer');

configure(function() {
  use(MethodOverride);
  use(ContentLength);
  use(CommonLogger);
  use(Cookie);
  use(Session);
  set('root',__dirname);
});

// Simple application which maps a array of pixels to clients

var jobName = 'mandel';
var height = 200;
var width = 200;
var pixels = new Array(height*width);
var buffer = new lpb.LongPollingBuffer(height*width);

function initializePayloads() {
  for(var x=0; x < width; x++) {
    for(var y=0; y < height; y++) {
      setPixel(x,y,[0,0,0,255]);
      Beehive.payload(jobName, {
        x: x,
        y: y
      });
    }
  }
}

function setPixel(x,y,color) {
  var i=(x*width+y) * 4;
  pixels[i]   = color[0];
  pixels[i+1] = color[1];
  pixels[i+2] = color[2];
  pixels[i+3] = color[3];
}

function parseResult(result) {
  setPixel(result.x, result.y, result.color);
  buffer.push(result);
}

Beehive.job('red', function(payload, init) {
  if(init) return; //no setup

  var color = [255,0,0,255];

  return {
    success: true,
    x: payload.x,
    y: payload.y,
    color: color
  }
}, parseResult);

Beehive.job('mandel', function(payload, init) {
  if(init) return;

  var x = payload.x,
      y = payload.y,
      w = 200,
      h = 200;

  var cpw = 0.8,
      cph = 0.8,
      xo  = 1.9,
      yo  = 0.5;

  x = cpw * (x/w - xo);
  y = cph * (y/h - yo);
  var x0 = x;
  var y0 = y;
  var iteration = 0;
  var maxIteration = 100;

  while (x*x + y*y <= 4 && iteration < maxIteration) {
    var xtemp = x*x - y*y + x0;
    y = 2*x*y + y0;
    x = xtemp;
    iteration++;
  }

  //var c = Math.round(255*iteration/maxIteration);
  var r,g,b;
  if(iteration == maxIteration) r=0,g=0,b=0;
  else {
    r = 0xaa-iteration*3;
    g = 0xff-iteration*9;
    b = iteration*4;
  }

  var color = [r,g,b,255];

  return {
    success: true,
    x: payload.x,
    y: payload.y,
    color: color
  }
}, parseResult);

// STATIC ROUTES
get('/', function() {
  return this.sendfile('index.html');
});

get('/js/*', function(file) {
  return this.sendfile(file);
});

// Get pixels
get('/pixels', function() {
  this.contentType('json');
  return JSON.stringify(pixels);
});
get('/pixels/:since', function(since) {
  var self = this;
  buffer.addListenerForUpdateSince(since, function(data) {
    self.contentType('json');
    var body = JSON.stringify(data);
    self.halt(200, body);
  });
});

// JOB ROUTES
get('/ping', function() {
  this.halt(200);
});

get('/jobs/job', function() {
  try {
    var c = Beehive.client(this.session.id, jobName);

    this.contentType('json');
    return c.getJobJSON();
  } catch(err) {
    this.halt(500, err+"\n\n"+inspect(err.stack));
  }
});


get('/jobs/payload', function() {
  try {
    var c = Beehive.client(this.session.id, jobName);

    this.contentType('json');
    return c.getPayloadJSON();
  } catch(err) {
    this.halt(500, err+"\n\n"+inspect(err.stack));
  }
});


post('/jobs/result', function() {
  try {
    var c = Beehive.client(this.session.id, jobName);
    c.submitResult(this.params.post);

    this.halt(200);
  } catch(err) {
    this.halt(500, err+"\n\n"+inspect(err.stack));
  }
});

get('/jobs/verifyQueue', function() {
  return JSON.stringify(Beehive.jobs[jobName].verify);
});

initializePayloads();
run(3000,'0.0.0.0');

// local workers
///*
for(var i=0; i<5000; i++) {
  var c = Beehive.client(false, jobName);
  c.runLocal(1000);
}
//*/
