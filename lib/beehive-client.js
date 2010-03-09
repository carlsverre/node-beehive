var BeehiveClient = function(userOptions) {
  if(!window['jQuery']) {
    throw "jQuery required.  Please ensure that it is loaded before using the BeehiveClient";
  }

  // set default options
  var options = {
    pausedCheckTime:      1000,
    jobLoopTime:          1000,
    pingCheckTime:        1000,
    debug:                false,
    debugLevel:           0,
    getJobRoute:          "/jobs/job",
    getPayloadRoute:      "/jobs/payload",
    postResultRoute:      "/jobs/result",
    getPingRoute:         "/ping"
  }

  for(var key in userOptions) {
    options[key] = userOptions[key];
  }

  // Initialize
  var paused = false;
  var errorPause = false;
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
    jQuery.ajax({
      url: options.getJobRoute,
      dataType: 'json',
      success: function(job) {
        eval('var jobFunc = '+job);
        jobFunc.call(jobObj, null, true);
        callback(jobFunc);
      }
    });
  }

  function getPayload(callback) {
    jQuery.ajax({
      url: options.getPayloadRoute,
      dataType: 'json',
      success: function(data) {callback(data,false)},
      error: function(req, textStatus) {
        callback(null, true);
      }
    });
  }

  function sendResult(payload,result) {
    debug(2,"Sending Job Result");
    result = {
      data: result,
      id: payload.id
    }
    var data = {
      json: JSON.stringify(result)
    }
    jQuery.ajax({
      type: 'POST',
      url: options.postResultRoute,
      data: data
    });
  }

  function processJob(callback) {
    var payload, result;

    getPayload(function(payload, error) {
      if(error || !payload) {
        debug(1,"Cannot contact server, trying again soon");
        return callback(false, true);
      }
      if(payload.banned) {
        debug(0, "You are banned, please go away.");
        return callback(true, false);
      }
      if(payload.empty) {
        debug(1, "No more payloads, trying again soon");
        return callback(false, false);
      }

      debug(2,"Processing job");

      result = job.call(jobObj, payload.data);
      if(result.success) {
        sendResult(payload,result);
      } else {
        debug(0,"Job failed");
      }
      callback(false, false);
    });
  }

  function ping(callback) {
    jQuery.ajax({
      url: options.getPingRoute,
      success: function(data){(!data||data=='')?callback(false):callback(true)},
      error: function(data){callback(false)}
    });
  }

  var loop = function() {
    if(paused) {
      return setTimeout(function() {
        loop();
      }, options.pausedCheckTime);

    } else if(errorPause) {
      return setTimeout(function() {
        ping(function(success) {
          if(success) {
            errorPause = false;
            getJob(function(jobFunc) {
              job = jobFunc;
            });
          }
          loop();
        });
      }, options.pingCheckTime);

    } else {
      return setTimeout(function() {
        processJob(function(banned, error) {
          if(error) errorPause = true;
          if(banned) paused = true;
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
  this.paused = function() {
    return paused;
  }
  this.resume = function() {
    debug(0,"Job loop resumed");
    paused=false;
  }

  return true;
}
