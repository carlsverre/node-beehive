exports.stringifyJob = function(jobFunc) {
  var seralized = jobFunc.toString();
  return JSON.stringify(seralized);
}

// Stolen from Visionmedia/express/utils.js
// Copyright TJ Holowaychuk
exports.uid = function() {
  var uid = ''
  for (var n = 4; n; --n)
    uid += (Math.abs((Math.random() * 0xFFFFFFF) | 0)).toString(16)
  return uid
}

exports.computeObjHash = function(obj) {
  var hash = "";
  for(var k in obj) {
    hash += k+obj[k];
  }
  return hash;
}

var checkArraysEqual = function(x,y) {
  if(!(x instanceof Array) || !(y instanceof Array)) return false;
  var p;
  for(p=0;p<y.length;p++) if(typeof(x[p])=='undefined') return false;
  for(p=0;p<y.length;p++) {
    if(y[p]) {
      switch(typeof(y[p])) {
        case 'object':
          if(!checkArraysEqual(x[p],y[p])) {return false;}; break;
        case 'function':
          if( (typeof(x[p])=='undefined')
          ||  (y[p].toString() != x[p].toString())) {return false;}; break;
        default:
          if(y[p] != x[p]) return false;
      }
    } else {
      if(x[p]) return false;
    }
  }

  for(p=0;p<y.length;p++) {
    if(typeof(y[p]) == 'undefined') return false;
  }

  return true;
}

exports.checkArraysEqual = checkArraysEqual;

var checkObjsEqual = function(x,y) {
  if(x instanceof Array || y instanceof Array) return checkArraysEqual(x,y);
  if((typeof(x) != 'object') || (typeof(y) != 'object')) return false;
  for(p in y) if(typeof(x[p])=='undefined') return false;
  for(p in y) {
    if(y[p]) {
      switch(typeof(y[p])) {
        case 'object':
          if(!checkObjsEqual(y[p],x[p])) {return false;}; break;
        case 'function':
          if( (typeof(x[p])=='undefined')
          ||  (y[p].toString() != x[p].toString())) {return false;}; break;
        default:
          if(y[p] != x[p]) return false;
      }
    } else {
      if(x[p]) return false;
    }
  }

  for(p in x) {
    if(typeof(y[p]) == 'undefined') return false;
  }

  return true;
}

exports.checkObjsEqual = checkObjsEqual;

Timer = Class({
  context: null,
  delay: null,
  timer: null,
  callback: null,
  running: false,
  init: function(context, delay, callback) {
    this.context = context;
    this.delay = delay;
    this.callback = callback;
    this.reset();
  },

  tick: function(callback, context) {
    callback.call(context);
  },

  reset: function() {
    if(this.running) clearInterval(this.timer);
    var self = this;
    this.timer = setInterval(function() {
      self.tick(self.callback,self.context);
    }, this.delay);
    this.running = true;
  },
  pause: function() {
    this.running = false;
    clearInterval(this.timer);
  },
  resume: function() {
    this.reset();
  }
});
