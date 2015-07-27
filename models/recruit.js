var mongoose = require('mongoose');

var recruitSchema = new mongoose.Schema({
    name: {type: 'String', required: true},
    collegeSwimmingId: {type: 'Number', unique: true}, //id from collegeswimming.com
    powerIndex: {type: 'Number'},
    gender: {type: 'String', enum: ['M', 'F']},
    times: [{type: mongoose.Schema.Types.ObjectId, ref: 'Time'}],
    archived: {type: 'Boolean', default: false},
    classYear: {type: 'Number', index: true},
    email: {type: 'String'},
    comments: {type: 'String'},
    height: {type: 'Number', min: 48, max: 96} // in inches
});

recruitSchema.set('autoIndex', false);

module.exports = mongoose.model('Recruit', recruitSchema);

