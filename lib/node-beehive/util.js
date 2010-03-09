exports.stringifyJob = function(jobFunc) {
  var seralized = jobFunc.toString();
  return JSON.stringify(seralized);
}

exports.computeObjHash = function(obj) {
  var hash = "";
  for(var k in obj) {
    hash += k+obj[k];
  }
  return hash;
}

Array.prototype.equals = function(x) {
  var p;
  for(p=0;p<this.length;p++) if(typeof(x[p])=='undefined') return false;
  for(p=0;p<this.length;p++) {
    if(this[p]) {
      switch(typeof(this[p])) {
        case 'object':
          debug("blah2");
          debug(this[p].equals(x[p]));
          if(!this[p].equals(x[p])) {return false;}; break;
        case 'function':
          if( (typeof(x[p])=='undefined')
          ||  (this[p].toString() != x[p].toString())) {return false;}; break;
        default:
          if(this[p] != x[p]) return false;
      }
    } else {
      if(x[p]) return false;
    }
  }

  for(p=0;p<this.length;p++) {
    if(typeof(this[p]) == 'undefined') return false;
  }

  return true;
}

Object.prototype.equals = function(x) {
  for(p in this) if(typeof(x[p])=='undefined') return false;
  for(p in this) {
    if(this[p]) {
      switch(typeof(this[p])) {
        case 'object':
          debug("blah1");
          debug(this[p].equals(x[p]));
          if(!this[p].equals(x[p])) {return false;}; break;
        case 'function':
          if( (typeof(x[p])=='undefined')
          ||  (p != 'equals' && this[p].toString() != x[p].toString())) {return false;}; break;
        default:
          if(this[p] != x[p]) return false;
      }
    } else {
      if(x[p]) return false;
    }
  }

  for(p in x) {
    if(typeof(this[p]) == 'undefined') return false;
  }

  return true;

}
