var mongoose = require('mongoose');

var EVENTS = [ "50 Y Free",
               "100 Y Free",
               "200 Y Free",
               "500 Y Free",
               "1000 Y Free",
               "1650 Y Free",
               "100 Y Back",
               "200 Y Back",
               "100 Y Breast",
               "200 Y Breast",
               "100 Y Fly",
               "200 Y Fly",
               "200 Y IM",
               "400 Y IM" ];

var timeSchema = new mongoose.Schema({
    time: {type: 'Number', required: true, min: 15},
    timeString: {type: 'String', required: true},
    eventName: {type: 'String', required: true, index: true, enum: EVENTS},
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
