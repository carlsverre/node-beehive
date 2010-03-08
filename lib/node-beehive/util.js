exports.stringifyJob = function(jobFunc) {
  var seralized = jobFunc.toString();
  return JSON.stringify(seralized);
}
