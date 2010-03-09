// Beehive - Core - Copyright Carl Sverre <carl@carlsverre.com> (MIT License)

process.mixin(require('sys'));

// util modules
var util = require('node-beehive/util');

Beehive = {
  version:        '0.1.0',
  clients:        {},
  jobs:           {},
  defaultJobName: "default",
  verifyNum:      2,
  reapDelay:      5000
}

Payload = Class({
  data: {},
  id: null,
  finished: false,

  init: function(data) {
    this.id = util.uid();
    this.data = data;
  },

  getData: function() {
    return {
      data: this.data,
      id: this.id
    }
  }
});

Job = Class({
  payloads: [],
  verify: {},
  jobFunc: function() {},
  callback: function() {},

  init: function(name, jobFunc, callback) {
    this.name = name;
    this.jobFunc = jobFunc;
    this.callback = callback;
  },

  addPayload: function(payload) {
    this.payloads.unshift(payload);
  },
  addPayloadFront: function(payload) {
    this.payloads.push(payload);
  },
  getPayload: function() {
    return this.payloads.pop();
  },

  verifyResult: function(client,payload,result) {
    result = {
      clientID: client.id,
      result: result
    }

    var id = payload.id;

    if(!(id in this.verify)) {
      this.verify[id] = [result];
    } else {
      this.verify[id].push(result);
      var verify = this.verify[id];

      if(verify.length >= Beehive.verifyNum) {
        var first = verify[0].result;

        for(var i=1; i < verify.length; i++) {
          var res = verify[i];
          
          if(!util.checkObjsEqual(first, res.result)) {
            puts("BANNING CLIENTS: ");
            for(var j=0; j<verify.length; j++) {
              var client = Beehive.clients[verify[j].clientID];
              puts("banning client #"+client.id);
              client.ban();
            }

            var self = this;
            setTimeout(function() {
              self.addPayloadFront(payload);
            }, 1500);
            return;
          }
        }

        payload.finished = true;
        delete this.verify[id];
        return this.callback(result.result);
      }
    }

    var self = this;
    setTimeout(function() {
      self.addPayloadFront(payload);
    }, 1500);
  },

  run: function(client, payload) {
    var result = this.jobFunc.call(client.localStorage, payload.data);
    this.verifyResult(client,payload,result);
  }
});

Client = Class({
  jobName: Beehive.defaultJobName,
  payload: null,
  reaper: null,
  working: false,
  banned: false,
  localStorage: {},
  localRunner: null,

  init: function(clientID) {
    this.id = clientID;
    this.reaper = new Timer(this, Beehive.reapDelay, this.payloadReaper);
  },

  ban: function() {
    this.banned = true;
  },
  unban: function() {
    this.banned = false;
  },
  updateProperties: function(obj) {
    if(this.banned) return {
      banned: true
    };

    if(obj==null) obj = {empty: true};

    obj["banned"] = false;
    obj["empty"] = false;

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
    this.reaper.reset();

    if(!this.working) {
      this.working = true;
      this.payload = this.getJob().getPayload();
    }

    return this.payload;
  },

  getPayloadJSON: function() {
    var payload = this.getPayload();
    payload = (payload) ? payload.getData() : null;
    return JSON.stringify(this.updateProperties(payload));
  },

  /*
   * result should be in the form:
   * {
   *    id: string    // the payload id
   *    data: object
   * }
   */
  submitResult: function(result) {
    if(this.banned) return false;

    if(this.working) {
      this.working = false;
      result = JSON.parse(result.json);
      if(result.id != this.payload.id) return false;
      this.getJob().verifyResult(this, this.payload, result.data);
    }
  },

  // harvest payloads from stale clients
  payloadReaper: function() {
    if(this.working) {
      if(!this.payload || this.payload.finished) return;
      debug("PAYLOAD REAPER REAPING");
      this.working = false;
      this.getJob().addPayloadFront(this.payload);
    }
  },

  runLocal: function(delay) {
    this.localRunner = new Timer(this, delay, this.localLoop);
  },
  localLoop: function() {
    var job = this.getJob();
    var payload = this.getPayload();
    if(!payload) {
      this.working = false;
      return;
    }
    job.run(this, payload);
    this.working = false;
  }
});

Beehive.client = function(clientID, jobName) {
  clientID = clientID || util.uid();

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

/**
 * _name_ is optional
 * @param {string} name         this is the name of the job so you can send payloads to specific jobs
 * @param {function} func       this is the job function to be called on the workers
 * @param {function} callback   this is the function which receives the jobFunc results
 * @api public
 */
Beehive.job = function(name, func, callback) {
  if(name instanceof Function) {
    callback = func;
    func = name;
    name = Beehive.defaultJobName;
  }
  Beehive.jobs[name] = new Job(name, func, callback);
}

/**
 * _job_ is optional
 * @param {string} job        this is the job to send this payload to
 * @param {object} payload    this is a object which will be sent to the workers
 * @api public
 */
Beehive.payload = function(job, payload) {
  if(!(typeof(job)=='string')) {
    payload = job;
    job = Beehive.defaultJobName;
  }
  job = Beehive.jobs[job];
  job.addPayload(new Payload(payload));
}
