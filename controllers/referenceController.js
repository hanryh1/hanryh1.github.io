var Recruit = require("../models/recruit");
var Promise = require("bluebird");
var Time = require("../models/time");
var ReferenceTime = require('../models/referenceTime');
var helpers = require("../lib/helpers");

controller = {}

controller.compareSwimmerToTeamMember = function(req, res) {
    if (!req.query.recruit || !req.query.teamMember) {
        res.status(400).send({"error": "Missing parameters."});
    } else {
        var getRecruitTimes = new Promise(function(f, r){
            Recruit.findOne({"name": req.query.recruit}, 'times height')
                   .populate('times')
                   .exec(function(err, r){
                        if (err) {
                            r(err);
                        } else {
                            f(r);
                        }
                   });
        });

        var getReferenceTimes = new Promise(function(f, r){
            ReferenceTime.find({"swimmer": req.query.teamMember}
                          , function(err, times){
                            if (err) {
                                r(err);
                            } else {
                                f(times);
                            }
                          });
        });

        Promise.all([getRecruitTimes, getReferenceTimes])
            .catch(function(err){
                res.status(500).send(err);
            })
            .then(function(results){
                var recruitTimes = results[0].times;
                var height = results[0].height;
                var recruitId = results[0]._id;
                var reference = results[1];
                if (!recruitTimes) {
                    return res.status(400).send({"error": "This recruit does not exist."});
                }
                if (reference.length == 0) {
                    return res.status(400).send({"error": "This team member does not exist."});
                }
                var deltas = [];
                for (var i = 0; i < recruitTimes.length; i++){
                    var t = recruitTimes[i];
                    var delta = null;
                    for (var j = 0; j < reference.length; j++){
                        if ( reference[j].eventName === t.eventName ){
                            delta = (reference[j].time - t.time).toFixed(2);
                            break;
                        }
                    }
                    deltas.push(delta);
                }
                console.log(height);
                res.status(200).send({ times: recruitTimes,
                                       deltas: deltas,
                                       height: height,
                                       recruitId: recruitId });
            });
    }
}

controller.getComparisonPage = function(req, res) {
    var getRecruits = new Promise(function(f, r){
        Recruit.getFullList(function(err, list){
            if (err) {
                r(err);
            } else {
                f(list);
            }
        });
    });

    var getTeamRoster = new Promise(function(f, r){
        ReferenceTime.getTeamRoster(function(err, roster){
            if (err) {
                r(err);
            } else {
                f(roster);
            }
        });
    });

    Promise.all([getRecruits, getTeamRoster])
        .catch(function(err){
            res.status(500).send(err);
        })
        .then(function(results){
            res.render('comparison', { "recruits": results[0],
                                       "roster": results[1] });
        });
}

module.exports = controller;
