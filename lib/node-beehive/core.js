// Beehive - Core - Copyright Carl Sverre <carl@carlsverre.com> (MIT License)

process.mixin(require('sys'));
process.mixin(require('node-beehive/dsl'));
process.mixin(require('node-beehive/access'));


/*
 * TODO: add route config to client
 * TODO: add server example in examples which makes the routes
 */

var util = require('node-beehive/util');

Beehive = {
    version:      '0.1.0',
    jobs:         {},
    payloadQueue: []
}

Client = function(id, ) {
  this.ID = 
}
