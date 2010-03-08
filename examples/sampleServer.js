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

var height = 50;
var width = 50;
var pixels = new Array(height*width);
var buffer = new lpb.LongPollingBuffer(height*width);

function initializePayloads() {
  for(var x=0; x < width; x++) {
    for(var y=0; y < height; y++) {
      setPixel(x,y,[0,0,0,255]);
      Beehive.payload({
        x: x,
        y: y
      }, parseResult);
    }
  }
}

function setPixel(x,y,color) {
  var i=(y+x*height) * 4;
  pixels[i]   = color[0];
  pixels[i+1] = color[1];
  pixels[i+2] = color[2];
  pixels[i+3] = color[3];
}

function parseResult(result) {
  setPixel(result.x, result.y, result.color);
  buffer.push(result);
}

Beehive.job(function(payload, init) {
  if(init) return; //no setup

  var x = payload.x,
      y = payload.y,
      w = 50,
      h = 50;

  x = 2.5 * (x/w - 0.5);
  y = 2 * (y/h - 0.5);
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

  var c = Math.round(255*iteration/maxIteration);
  var color = [c,c,c,255];

  return {
    success: true,
    x: payload.x,
    y: payload.y,
    color: color
  }
});

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
  var c = Beehive.client(this.session.id);

  this.contentType('json');
  return c.getJobJSON();
});


get('/jobs/payload', function() {
  var c = Beehive.client(this.session.id);

  this.contentType('json');
  return c.getPayloadJSON();
});


post('/jobs/result', function() {
  try {
    var c = Beehive.client(this.session.id);
    c.submitResult(this.params.post);

    this.halt(200);
  } catch(err) {
    this.halt(500, err+"\n\n"+inspect(err));
  }
});

initializePayloads();
run(3000,'0.0.0.0');
