exports.stringifyJob = function(unseralized) {
  seralized = {
    job: unseralized.job.toString(),
    verifyTest: unseralized.verifyTest.toString(),
    testPayload: unseralized.testPayload
  }

  return JSON.stringify(seralized);
}
