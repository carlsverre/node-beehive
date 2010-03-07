var BeehiveClient = function(userOptions) {
  if(!window['jQuery']) {
    throw "jQuery required.  Please ensure that it is loaded before using the BeehiveClient";
  }

  // set default options
  var options = {
    pausedCheckTime:      1000,
    jobLoopTime:          1000,
    debug:                false,
    debugLevel:           0,
    getJobRoute:          "/jobs/job",
    getPayloadRoute:      "/jobs/payload",
    postResultRoute:      "/jobs/result"
  }

  for(var key in userOptions) {
    options[key] = userOptions[key];
  }

  // Initialize
  var paused = false;
  var job, jobObj = {};

  getJob(function(jobFunc) {
    job = jobFunc;
  });

  function debug(n,s) {
    if(options.debug instanceof Function) {
      if(n <= options.debugLevel)
        options.debug(s);
    }
  }

  function getJob(callback) {
    jQuery.getJSON(options.getJobRoute, function (job) {
      eval('var jobFunc = '+job.job);
      if(job.verifyTest instanceof String) {
        eval('job.verifyTest = '+job.verifyTest);
        var result = jobFunc.call(jobObj, job.testPayload, true);
        if(job.verifyTest(result)) callback(jobFunc);
      } else {
        jobFunc.call(jobObj, null, true);
        callback(jobFunc);
      }
    });
  }

  function getPayload(callback) {
    jQuery.getJSON(options.getPayloadRoute, function(payload) {
      callback(payload);
    });
  }

  function sendResult(result) {
    debug(1,"Job result " + result.result);
  }

  function processJob(callback) {
    var payload, result;

    debug(2,"Running job");

    getPayload(function(payload) {
      result = job.call(jobObj, payload);
      if(result.success) {
        sendResult(result);
      } else {
        debug(0,"Job failed");
      }
      callback();
    });
  }

  var loop = function() {
    if(paused) {
      debug(2,"Job Loop is paused, checking in "+options.pausedCheckTime);
      return setTimeout(function() {
        loop();
      }, options.pausedCheckTime);
    } else {
      return setTimeout(function() {
        processJob(function() {
          loop();
        });
      }, options.jobLoopTime);
    }
  }

  this.jobLoop = loop;

  this.pause = function() {
    debug(0,"Job loop paused");
    paused=true;
  }
  this.resume = function() {
    debug(0,"Job loop resumed");
    paused=false;
  }

  return true;
}
