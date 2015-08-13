var mongoose = require('mongoose');

var standardTimeSchema = new mongoose.Schema({
  time: {type: 'Number', required: true},
  eventName: {type: 'String', required: true, index: true},
  gender: {type: 'String', enum: ['M', 'F'], required: true},
  created: {type:'Date', default: Date.now},
  type: {type: 'String', enum: ['A', 'B', 'Inv'], required: true}
});

standardTimeSchema.set('autoIndex', false);

standardTimeSchema.index({ gender: 1, eventName: 1, type: 1, time: -1});

module.exports = mongoose.model('StandardTime', standardTimeSchema);
