var mongoose = require('mongoose');

var timeSchema = new mongoose.Schema({
    time: {type: 'Number', required: true},
    timeString: {type: 'String', required: true},
    eventName: {type: 'String', required: true, index: true},
    points: {type: 'Number'},
    manual: {type: 'Boolean'},
    recruit: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruit'},
    archived: {type: 'Boolean', default:false},
    teamRank: {type: 'Number'},
    nationalRank: {type: 'Number'},
});

timeSchema.set('autoIndex', false);

module.exports = mongoose.model('Time', timeSchema);
