require.paths.unshift(__dirname + '/../lib');
require('express');
require('express/plugins');
require('node-beehive');

configure(function() {
  use(MethodOverride);
  use(ContentLength);
  use(CommonLogger);
  set('root',__dirname);
});

function parseResult(result) {
  debug(result);
}

// Create job and some payloads
job("test", function(payload, init) {
  if(init) {
    this.counter=0;
    return;
  }

  this.counter++;

  return {
    success: true,
    result: payload.data1 + payload.data2
  }
});

// STATIC ROUTES
get('/', function() {
  return this.sendfile('index.html');
});

get('/js/*', function(file) {
  return this.sendfile(file);
});

// JOB ROUTES
get('/jobs/job', function() {
  this.contentType('json');
  return getJobJSON('test');
});
get('/jobs/payload', function() {
  payload({
    data1: 1,
    data2: 3
  }, parseResult);
  this.contentType('json');
  return getPayload();
});
post('/jobs/result', function() {
  debug(inspect(params));
});

run();
