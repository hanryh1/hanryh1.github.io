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

timeSchema.pre('save', function(next){
    var self = this;
    mongoose.model('Recruit')
        .findById(self.recruit, "gender")
        .exec(function(err, recruit){
            var gender = recruit.gender;
             mongoose.model('ReferenceTime')
                .findOne({ "eventName": self.eventName,
                        "gender": gender,
                        "time": { $gt: self.time },
                        "type": "Team" })
                .sort({ "time" : 1})
                .exec(function(err, teamTime){
                    if (teamTime) {
                        self.teamRank = teamTime.rank;
                    }
                    mongoose.model('ReferenceTime')
                        .findOne({ "eventName": self.eventName,
                                "gender": gender,
                                "time": { $gt: self.time },
                                "type": "Nationals" })
                        .sort({ "time" : 1})
                        .exec(function(err, nationalTime){
                            if (nationalTime) {
                                self.nationalRank = nationalTime.rank;
                            }
                            next();
                        });
                });
            });
});

module.exports = mongoose.model('Time', timeSchema);
