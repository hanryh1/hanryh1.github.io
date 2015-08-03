var mongoose = require('mongoose');
var Promise = require("bluebird");

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
    inFrontOf: {type: mongoose.Schema.Types.ObjectId, ref: 'ReferenceTime'},
    behind: {type: mongoose.Schema.Types.ObjectId, ref: 'ReferenceTime'},
    nationalRank: {type: 'Number'},
    standard: {type: 'String', enum: ['A', 'B', 'Inv']}
});

timeSchema.set('autoIndex', false);

// // set rankings and time standards
timeSchema.pre('save', function(next){
    var self = this;
    mongoose.model('Recruit')
        .findById(self.recruit, "gender")
        .exec(function(err, recruit){
            var gender = recruit.gender;

            var setTeamRank = new Promise(function(f, r){
                mongoose.model('ReferenceTime')
                    .findOne({ "eventName": self.eventName,
                            "gender": gender,
                            "time": { $gt: self.time },
                            "type": "Team" })
                    .sort({ "time" : 1})
                    .exec(function(err, slower){  
                        if (slower) {
                            self.teamRank = slower.rank;
                            self.inFrontOf = slower._id;
                        }
                        f(self);
                    });
                });

            var setFaster = new Promise(function(f, r){
                mongoose.model('ReferenceTime')
                    .findOne({ "eventName": self.eventName,
                            "gender": gender,
                            "time": { $lt: self.time },
                            "type": "Team" })
                    .sort({ "time" : -1})
                    .exec(function(err, faster){
                        if (faster) {
                            self.behind = faster._id;
                        }
                        f(self);
                    });
                });

            var setNationalRank = new Promise(function(f, r){
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
                        f(self);
                    });
                });

            var setStandard = new Promise(function(f, r){
                mongoose.model('StandardTime')
                  .findOne({ "eventName": self.eventName,
                    "gender": gender,
                    "time": { $gt: self.time }})
                    .sort({ "time" : 1})
                    .exec(function(err, standardTime){
                        if (standardTime){
                          self.standard = standardTime.type;
                        }
                        f(self);
                    });
                });

            Promise.all([setTeamRank, setFaster, setNationalRank, setStandard])
                   .then(function(result){
                        next();
                   });
        });
});

var differenceInBodylengths = function(time, height, inFrontOf) {
    var diff = inFrontOf ? time.inFrontOf.time - time.time : time.time - time.behind.time;
    var avgSpeed = parseInt(time.eventName.split(" ")[0]) / time.time;
    var heightInYards = height / 36;
    return (avgSpeed * diff / heightInYards).toFixed(2);
}

timeSchema.method('getInFrontOfMessage', function(){
    return (this.inFrontOf.time - this.time).toFixed(2) + "s faster than " + this.inFrontOf.swimmer;
});

timeSchema.method('getBehindMessage', function(){
    return (this.time - this.behind.time).toFixed(2) + "s slower than " + this.behind.swimmer;
});

timeSchema.method('getInFrontOfBodyLengthsMessage', function(height){
    return differenceInBodylengths(this, height, true) + " body lengths ahead of " + this.inFrontOf.swimmer
});

timeSchema.method('getBehindBodyLengthsMessage', function(height){
    return differenceInBodylengths(this, height, false) + " body lengths behind " + this.behind.swimmer;
});

module.exports = mongoose.model('Time', timeSchema);
