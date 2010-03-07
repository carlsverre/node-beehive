/*
 * job: {job:func, verifyTest:func, testPayload:dict}
 */
exports.job = function(name, job) {
  if(typeof(job) == 'object') {
    Beehive.jobs[name] = job;
  } else {
    Beehive.jobs[name] = {job: job, verifyTest:false};
  }
};

exports.payload = function(payload, callback) {
  Beehive.payloadQueue.unshift({
    payload: payload,
    callback: callback
  });
}
