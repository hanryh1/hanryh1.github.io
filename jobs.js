var controller = require('./controllers/recruitController');
var mongoose = require('mongoose');
var async = require('async');
var cronjob = require('cron').CronJob;

var updateAllRecruits = function(){
    mongoose.model('Recruit').find({"archived": false}, function(err, recruits){
        var calls = [];
        recruits.forEach(function(recruit){
            calls.push(function(callback){
                controller.updateTime(recruit, function(err, r){
                    if (err){
                        return callback(err);
                    } else{
                        controller.updatePowerIndex(r, function(err, r){
                            if (err){
                                return callback(err);
                            } else{
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

var job = new cronjob({cronTime: '00 00 8 * * *',
  onTick: updateAllRecruits,
    /*
     * Runs every day at 8:00 AM (EST)
     */
  start: false,
  timeZone: 'America/New_York'
});

job.start();



