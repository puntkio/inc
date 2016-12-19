;(function() {
  'use strict';

  var program = require('commander');
  var convictCommander = require('convict-commander');

  module.exports = function(config)
  {
    convictCommander(program) // Enable convict-commander
    .version('0.0.1')
    .convict(config) // Add the metadata
    .parse(process.argv);
  }

}());
