var mongoose = require('mongoose');

var referenceTimeSchema = new mongoose.Schema({
  time: {type: 'Number', required: true},
  eventName: {type: 'String', required: true, index: true},
  rank: {type: 'Number', required: true},
  gender: {type: 'String', enum: ['M', 'F'], required: true},
  meet: {type: 'String'},
  type: {type: 'String', enum: ['Meet', 'Team'], required: true}
});

referenceTimeSchema.set('autoIndex', false);

referenceTimeSchema.index({ gender: 1, eventName: 1, time: -1 });

module.exports = mongoose.model('ReferenceTime', referenceTimeSchema);
