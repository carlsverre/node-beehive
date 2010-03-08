require.paths.unshift(__dirname + '/../lib');
require('node-beehive');

p = function(s) {
  puts(inspect(s));
}

pt = function(t,s) {
  puts(t);
  p(s);
}

function parseResult(result) {
  pt("Result:",result);
}

// Create job
Beehive.job(function(payload, init) {
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

Beehive.payload({
  data1: 1,
  data2: 3
}, parseResult);

pt("Beehive:",Beehive);

var c = Beehive.client();

var job = c.getJob();
pt("JobJSON", c.getJobJSON());

var payload = c.getPayload();
var payloadJSON = c.getPayloadJSON();

pt("Client:",c);
pt("Payload:",payload);
pt("PayloadJSON:",payloadJSON);

puts("Computing Job");
var result = job.run(c, payload);

pt("Result:",result);
c.submitResult(result);
