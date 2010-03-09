// Beehive - Core - Copyright Carl Sverre <carl@carlsverre.com> (MIT License)

process.mixin(require('sys'));

// util modules
var util = require('node-beehive/util');

Beehive = {
  version:        '0.1.0',
  clients:        {},
  jobs:           {},
  defaultJobName: "default",
  verifyNum:      2     // verifyNum > 1
}

Job = Class({
  payloads: [],
  verify: {},
  jobFunc: function() {},

  init: function(name, jobFunc) {
    this.name = name;
    this.jobFunc = jobFunc;
  },

  addPayload: function(obj) {
    this.payloads.unshift(obj);
  },
  addPayloadFront: function(obj) {
    this.payloads.push(obj);
  },
  getPayload: function() {
    return this.payloads.pop();
  },

  verifyResult: function(client,payload,result) {
    var hash = util.computeObjHash(payload.payload);
    result = {
      client: client,
      result: result
    }

    if(!(hash in this.verify)) {
      this.verify[hash] = [result];
    } else {
      var verify = this.verify[hash];
      verify.push(result);

      debug(inspect(verify));

      if(verify.length >= Beehive.verifyNum) {
        var first = verify[0].result;
        for(var i=1; i < verify.length; i++) {
          var res = verify[i];

          debug("--");
          debug(inspect(first));
          debug(inspect(res.result));
          debug(inspect(first.equals(res.result)));
          debug("--");

          if(!first.equals(res.result)) {
            for(var j=0; j<verify.length; j++) {
              verify[j].client.ban();
            }
            return;
          }
        }
        return payload.callback(result.result);
      }
    }

    var self = this;
    setTimeout(function() {
      self.addPayloadFront(payload);
    }, 1500);
  },

  run: function(client, payload) {
    return this.jobFunc.call(client.localStorage, payload);
  }
});

Client = Class({
  jobName: Beehive.defaultJobName,
  payload: null,
  working: false,
  banned: false,
  localStorage: {},

  init: function(clientID) {
    this.id = clientID || Beehive.clients.length;
  },

  ban: function() {
    this.banned = true;
  },
  unban: function() {
    this.banned = false;
  },
  checkBan: function(obj) {
    if(this.banned) return {
      banned: true
    };

    obj["banned"] = false;
    return obj;
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
    return JSON.stringify(this.checkBan(payload));
  },

  submitResult: function(result) {
    if(this.banned) return false;

    if(this.working) {
      this.working = false;
      result = JSON.parse(result.json);
      this.getJob().verifyResult(this, this.payload, result);
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
