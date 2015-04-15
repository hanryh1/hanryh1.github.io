var mongoose = require('mongoose');

var timeSchema = new mongoose.Schema({
  time: {type: 'Number', required: true},
  timeString: {type: 'String', required: true},
  eventName: {type: 'String', required: true},
  points: {type: 'Number'},
  date: {type: 'Date'},
  manual: {type: 'Boolean'},
  recruit: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruit'}
});

module.exports = mongoose.model('Time', timeSchema);
