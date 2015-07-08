var mongoose = require('mongoose');

var referenceTimeSchema = new mongoose.Schema({
    time: {type: 'Number', required: true},
    eventName: {type: 'String', required: true, index: true},
    rank: {type: 'Number', required: true},
    gender: {type: 'String', enum: ['M', 'F'], required: true},
    created: {type: 'Date', default: Date.now},
    type: {type: 'String', enum: ['Team', 'Nationals'], required: true}
});

referenceTimeSchema.set('autoIndex', false);

referenceTimeSchema.index({ type: 1, gender: 1, eventName: 1, time: -1 });

module.exports = mongoose.model('ReferenceTime', referenceTimeSchema);
