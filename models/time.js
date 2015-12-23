var mongoose = require('mongoose');
var Promise  = require("bluebird");
var EVENTS   = require("../lib/events");

var timeSchema = new mongoose.Schema({
  time: {type: 'Number', required: true, min: 15},
  timeString: {type: 'String', required: true},
  eventName: {type: 'String', required: true, index: true, enum: EVENTS},
  points: {type: 'Number'},
  manual: {type: 'Boolean'},
  recruit: {type: mongoose.Schema.Types.ObjectId, ref: 'Recruit'},
  teamRank: {type: 'Number'},
  inFrontOf: {type: mongoose.Schema.Types.ObjectId, ref: 'ReferenceTime'},
  behind: {type: mongoose.Schema.Types.ObjectId, ref: 'ReferenceTime'},
  nationalRank: {type: 'Number'},
  standard: {type: 'String', enum: ['A', 'B', 'Inv']}
});

timeSchema.set('autoIndex', false);

// // set rankings and time standards
timeSchema.pre('save', function(next) {
  var self = this;
  mongoose
    .model('Recruit')
    .findById(self.recruit, "gender")
    .exec(function(err, recruit){
      var gender = recruit.gender;

      var setTeamRank = new Promise(function(f, r) {
          mongoose.model('ReferenceTime')
              .findOne({ "eventName": self.eventName,
                      "gender": gender,
                      "time": { $gt: self.time },
                      "type": "Team" })
              .sort({ "time" : 1})
              .exec(function(err, slower) {
                  if (slower) {
                      self.teamRank = slower.rank;
                      self.inFrontOf = slower._id;
                  }
                  f(self);
              });
          });

      var setFaster = new Promise(function(f, r) {
        mongoose
          .model('ReferenceTime')
            .findOne({ "eventName": self.eventName,
                       "gender": gender,
                       "time": { $lt: self.time },
                       "type": "Team" })
            .sort({ "time" : -1})
            .exec(function(err, faster) {
              if (faster) {
                  self.behind = faster._id;
              }
              f(self);
            });
        });

      var setNationalRank = new Promise(function(f, r) {
        mongoose
          .model('ReferenceTime')
            .findOne({ "eventName": self.eventName,
                       "gender": gender,
                       "time": { $gt: self.time },
                       "type": "NationalsPrelims" })
            .exec(function(err, finalsQualifyingTime) {
              if (finalsQualifyingTime) {
                // no prelim/finals for 1650
                if (self.eventName.indexOf("1650") != -1) {
                  self.nationalRank = finalsQualifyingTime.rank;
                }
                // check against prelims times to see if time would have made finals
                // then find the rank it would have gotten in finals
                var rankUpperBound = finalsQualifyingTime.rank > 8 ? 16 : 8;
                var rankLowerBound = finalsQualifyingTime.rank > 8 ? 9 : 1;
                mongoose.model('ReferenceTime')
                  .findOne({ "eventName": self.eventName,
                             "gender": gender,
                             "rank" : { $gt: rankLowerBound - 1, $lt: rankUpperBound + 1 },
                             "time": { $gt: self.time },
                             "type": "NationalsFinals" })
                  .exec(function(err, nationalTime) {
                    if (nationalTime) {
                      self.nationalRank = nationalTime.rank;
                    } else if (self.eventName.indexOf("1650") == -1){
                      self.nationalRank = rankUpperBound;
                    }
                    f(self);
                  });
              } else {
                f(self);
              }
            });
        });

      var setStandard = new Promise(function(f, r) {
        mongoose
          .model('StandardTime')
            .findOne({ "eventName": self.eventName,
                       "gender": gender,
                       "time": { $gt: self.time }})
            .sort({ "time" : 1})
            .exec(function(err, standardTime) {
              if (standardTime){
                self.standard = standardTime.type;
              }
              f(self);
            });
        });

      Promise
        .all([setTeamRank, setFaster, setNationalRank, setStandard])
           .then(function(result) {
              next();
           });
    });
});

function differenceInBodylengths(time, height, inFrontOf) {
  var diff = inFrontOf ? time.inFrontOf.time - time.time : time.time - time.behind.time;
  var avgSpeed = parseInt(time.eventName.split(" ")[0]) / time.time;
  var heightInYards = height / 36;
  return (avgSpeed * diff / heightInYards).toFixed(2);
}

timeSchema.method('getInFrontOfMessage', function() {
  return (this.inFrontOf.time - this.time).toFixed(2) + "s faster than " + this.inFrontOf.swimmer;
});

timeSchema.method('getBehindMessage', function() {
  return (this.time - this.behind.time).toFixed(2) + "s slower than " + this.behind.swimmer;
});

timeSchema.method('getInFrontOfBodyLengthsMessage', function(height) {
  return differenceInBodylengths(this, height, true) + " body lengths ahead of " + this.inFrontOf.swimmer
});

timeSchema.method('getBehindBodyLengthsMessage', function(height) {
  return differenceInBodylengths(this, height, false) + " body lengths behind " + this.behind.swimmer;
});

module.exports = mongoose.model('Time', timeSchema);
