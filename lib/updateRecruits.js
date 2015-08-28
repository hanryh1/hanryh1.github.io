var async         = require('async');
var cronjob       = require('cron').CronJob;

var controller    = require('../controllers/recruitController');

var Configuration = require('../models/configuration');
var Recruit       = require('../models/recruit');

var job = {};

function generateQuery(updateAll, callback) {
  if (updateAll) {
    callback(null, {});
  } else {
    Configuration.getDefaultYear(function(err, year){
      callback(err, {classYear: year});
    });
  }
}

function updateAllRecruits(updateAll) {
  console.log("Updating all recruits.");
  generateQuery(updateAll, function(err, query){
    if (err) {
      console.log("Something went wrong: ", err);
    }
    Recruit.find(query, function(err, recruits) {
      var calls = [];
      recruits.forEach(function(recruit) {
        calls.push(function(callback) {
          controller.updateTime(recruit, function(err, r) {
            if (err){
              console.log("Error updating times for "+ recruit.name);
              return callback(err);
            } else{
              controller.updatePowerIndex(r, function(err, r) {
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
  });
}

job.updateRecruitsJob = new cronjob({cronTime: '00 30 13 * * 1',
  onTick: updateAllRecruits,
    /*
     * Runs every Monday at 1:30 PM (EST)
     */
  start: false,
  timeZone: 'America/New_York'
});

job.updateAllRecruits = updateAllRecruits;

module.exports = job;
