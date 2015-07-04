var mongoose = require('mongoose');

var recruitSchema = new mongoose.Schema({
  name: {type: 'String', required: true},
  collegeSwimmingId: {type: 'Number', unique: true}, //id from collegeswimming.com
  powerIndex: {type: 'Number'},
  gender: {type: 'String', enum: ['M', 'F']},
  times: [{type: mongoose.Schema.Types.ObjectId, ref: 'Time'}],
  archived: {type: 'Boolean', default: false},
  classYear: {type: 'Number'}
});

module.exports = mongoose.model('Recruit', recruitSchema);

