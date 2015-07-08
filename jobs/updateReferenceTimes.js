var mongoose = require('mongoose');
var async = require('async');
var cronjob = require('cron').CronJob;
var request = require('request');

// eventdistance, eventstroke
var EVENTS = [["50",1],
              ["100",1],
              ["200",1],
              ["500",1],
              ["1000",1],
              ["1650",1],
              ["100",2],
              ["200",2],
              ["100",3],
              ["200",3],
              ["100",4],
              ["200",4],
              ["200",5],
              ["400",5]];

var mapNumbersToEventName = function(eventDistance, eventStroke) {
    var STROKES = ["Free", "Back", "Breast", "Fly", "IM"];
    return eventDistance + " Y " + STROKES[eventStroke];
}

var getTeamTimesForEvent = function(event, payload, callback) {
    payload["eventdistance"] = event[0];
    payload["eventstroke"] = String(event[1]);

    var options = {
      method: 'post',
      body: payload,
      json: true,
      url: "http://www.collegeswimming.com/times/ws/"
    }

    request(options, function(err, httpResponse, body){
        callback(err, body);
    });
}

var getTeamTimes = function() {
    console.log("Updating team reference times");
    var today = new Date();
    var year = today.getFullYear()-1;
    var season = String(year) + "-" + String(year + 1);
    var startdate = String(year) + "-07-01";
    var enddate = String(year) + "-06-31";
    var genders = ["M", "F"];

    var calls = [];
    for (var i = 0; i < genders.length; i++) {
        for (var j = 0; j < EVENTS.length; j ++){
            (function(index, calls, gender){
                var payload = {
                                "orgcode":"3",
                                "team": process.env.TEAM_ID,
                                "season": season,
                                "startdate": startdate,
                                "enddate": enddate,
                                "eventgender": gender
                              }
                var e = EVENTS[j];
                calls.push(function(callback){
                    getTeamTimesForEvent(e, payload, function(err, body){
                        if (err){
                            console.log("Error: ", err);
                        } else {
                            var results = body["ResultSet"];
                            var times = [];
                            for (var k = 0; k < results.length; k++){
                                var eventDist = e[0];
                                var eventStroke = e[1]-1;
                                var time = {
                                             "time": parseFloat(results[k]["time"]),
                                             "rank": results[k]["pos"],
                                             "eventName": mapNumbersToEventName(eventDist, eventStroke),
                                             "gender": results[k]["eventgender"],
                                             "type": "Team"
                                            };
                                times.push(time);
                            }
                            mongoose.model('ReferenceTime').create(times, function(err, docs){
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, true);
                                }
                            });
                        }
                    });
                });
            })(j, calls, genders[i]);
        }
    }

    mongoose.model('ReferenceTime').remove({"type": "Team"}, function(err){
        if (err) {
            console.log("Error removing old reference times: ", err);
        } else {
            console.log("Successfully removed old reference times.");
            async.parallel(calls, function(err, result) {
                if (err){
                    console.log("Something went wrong while creating reference times.");
                } else {
                    console.log("Reference times successfully created.");
                }
            });
        }
    });
}

var updateReferenceTimesJob = new cronjob({cronTime: '15 18 2 8 6 *',
  onTick: getTeamTimes,
    /*
     * Runs once a year after the season is over on April 15.
     */
  start: false,
  timeZone: 'America/New_York'
});

module.exports = updateReferenceTimesJob;