var mongoose = require('mongoose');

var recruitSchema = new mongoose.Schema({
  name: {type: 'String', required: true},
  collegeSwimmingId: {type: 'Number', unique: true}, //id from collegeswimming.com
  points: {type: 'Number'}
  lastUpdated: {type: 'Date', default: Date.now },
  times: [{type: mongoose.Schema.Types.ObjectId, ref: 'Time'}],
  photo: {type: 'Buffer'},
});

module.exports = mongoose.model('Recruit', recruitSchema);

