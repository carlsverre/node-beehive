// Beehive - Core - Copyright Carl Sverre <carl@carlsverre.com> (MIT License)

var classes = {
  Beehive: {
    version:      '0.1.0',
    jobs:         {},
    payloadQueue: []
  },
  Util: require('node-beehive/util')
}

process.mixin(require('sys'));
process.mixin(classes);
process.mixin(require('node-beehive/dsl'));
process.mixin(require('node-beehive/access'));


/*
 * TODO: add route config to client
 * TODO: add server example in examples which makes the routes
 */
