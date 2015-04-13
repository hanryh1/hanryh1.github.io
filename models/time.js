var mongoose = require('mongoose');

var timeSchema = new mongoose.Schema({
  time: {type: 'String', required: true},
  eventName: {type: 'String', required: true},
  points: {type: 'Number', required: true},
  date: {type: 'Date'},
  recruit: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruit'}
});

module.exports = mongoose.model('Time', timeSchema);
