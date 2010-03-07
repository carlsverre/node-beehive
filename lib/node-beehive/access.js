exports.getPayload = function() {
  if(Beehive.payloadQueue.length > 0) {
    return JSON.stringify(Beehive.payloadQueue.pop());
  }
  return false;
}

exports.getJobJSON = function(name) {
  return Util.stringifyJob(Beehive.jobs[name]) || JSON.stringify(false);
}
