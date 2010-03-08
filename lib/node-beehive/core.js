// Beehive - Core - Copyright Carl Sverre <carl@carlsverre.com> (MIT License)

process.mixin(require('sys'));

// util modules
var util = require('node-beehive/util');

Beehive = {
  version:        '0.1.0',
  clients:        {},
  jobs:           {},
  defaultJobName: "default"
}


Job = Class({
  payloads: [],
  jobFunc: function() {},
  init: function(name, jobFunc) {
    this.name = name;
    this.jobFunc = jobFunc;
  },

  addPayload: function(obj) {
    this.payloads.unshift(obj);
  },
  getPayload: function() {
    return this.payloads.pop();
  },

  run: function(client, payload) {
    return this.jobFunc.call(client.localStorage, payload);
  }
});

Client = Class({
  jobName: Beehive.defaultJobName,
  payload: null,
  working: false,
  localStorage: {},

  init: function(clientID) {
    this.id = clientID || Beehive.clients.length;
  },

  getJob: function() {
    return Beehive.jobs[this.jobName];
  },

  getJobFunc: function() {
    return this.getJob().jobFunc;
  },

  getJobJSON: function() {
    return util.stringifyJob(this.getJobFunc());
  },

  getPayload: function() {
    if(!this.working) {
      this.working = true;
      this.payload = this.getJob().getPayload();
    }

    return this.payload.payload;
  },

  getPayloadJSON: function() {
    var payload = this.getPayload();
    return JSON.stringify(payload);
  },

  submitResult: function(result) {
    if(this.working) {
      this.working = false;
      result = JSON.parse(result.json);
      this.payload.callback(result);
    } else {
      //throw "Client does not have a callback";
      this.working = true;
    }
  }
});

Beehive.client = function(clientID, jobName) {
  var c;
  if(Beehive.clients[clientID]) {
    c = Beehive.clients[clientID];
  } else {
    c = new Client(clientID);
    Beehive.clients[clientID] = c;
  }

  if(typeof(jobName) != 'undefined')
    c.jobName = jobName;
  
  return c;
}

Beehive.job = function(name, func) {
  if(name instanceof Function) {
    func = name;
    name = Beehive.defaultJobName;
  }
  Beehive.jobs[name] = new Job(name, func);
}

Beehive.payload = function(job, payload, callback) {
  if(!(job instanceof String)) {
    callback = payload;
    payload = job;
    job = Beehive.defaultJobName;
  }
  job = Beehive.jobs[job];
  job.addPayload({
    payload: payload,
    callback: callback
  });
}
