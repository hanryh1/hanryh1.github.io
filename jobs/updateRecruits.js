var controller = require('../controllers/recruitController');
var mongoose = require('mongoose');
var async = require('async');
var cronjob = require('cron').CronJob;

var updateAllRecruits = function(){
    console.log("Updating all recruits.");
    mongoose.model('Recruit').find({"archived": false}, function(err, recruits){
        var calls = [];
        recruits.forEach(function(recruit){
            calls.push(function(callback){
                controller.updateTime(recruit, function(err, r){
                    if (err){
                        console.log("Error updating times for "+ recruit.name);
                        return callback(err);
                    } else{
                        controller.updatePowerIndex(r, function(err, r){
                            if (err){
                                console.log("Error updating power index for " + recruit.name);
                                return callback(err);
                            } else{
                                console.log("Successfully updated " + recruit.name);
                                return callback(null, r);
                            }
                        });
                    }
                });
            });
        });
        async.parallel(calls, function(err, result) {
            if (err){
                console.log("Something went wrong.");
            } else {
                console.log("Recruits updated successfully.");
            }
        });
    });
}

var updateRecruitsJob = new cronjob({cronTime: '00 30 13 * * 1',
  onTick: updateAllRecruits,
    /*
     * Runs every Monday at 1:30 PM (EST)
     */
  start: false,
  timeZone: 'America/New_York'
});

module.exports = updateRecruitsJob;
