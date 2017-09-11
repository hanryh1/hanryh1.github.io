var async             = require('async');
var mongoose          = require('mongoose');
var request           = require('request');

var helpers           = require('./helpers');
var updateAllRecruits = require("./updateRecruits").updateAllRecruits;

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

var STROKES = ["Free",
               "Back",
               "Breast",
               "Fly",
               "IM"];

function mapNumbersToEventName(eventDistance, eventStroke) {
  return eventDistance + " Y " + STROKES[eventStroke];
}

// Turn "Bitdiddle, Ben" into "Ben Bitdiddle"
// Currently unused
function formatSwimmerName(name){
  var names = name.split(", ");
  return names[1] + " " + names[0];
}

function getTeamTimesForEvent(event, payload, teamId, callback) {
  payload["event"] = String(event[1]) + event[0];

  var options = {
    method: 'get',
    qs: payload,
    url: "http://www.collegeswimming.com/team/" + teamId + "/times/"
  }

  request(options, function(err, httpResponse, body) {
    callback(err, body);
  });
}

// Because collegeswimming changed their website yet again
// Returns array of time objects
function parseHtmlResults(html, callback) {
  var cheerio = require("cheerio"),
    $ = cheerio.load(html);
  if ($(".page404").length > 0) {
    callback({"error": "Times not found", "status": 404});
  } else {
    var times = []
    $("tbody > tr").each(function(i, tr){
      var time = {
        "rank": $(tr).find("td:nth-child(1)").text(),
        "swimmer": $(tr).find("td:nth-child(2)").text().trim(),
        "time": helpers.convertTimeToNumber($(tr).find("td:nth-child(5)").text()),
        "timeString": $(tr).find("td:nth-child(5)").text().trim(),
        "type": "Team"
      };
      times.push(time);
    });
    callback(null, times);
  }
}

function getTeamTimes(teamId, seasonYear) {
  var year = parseInt(seasonYear);
  var season = String(year) + "-" + String(year + 1);
  var genders = ["M", "F"];

  var calls = [];
  for (var i = 0; i < genders.length; i++) {
    for (var j = 0; j < EVENTS.length; j ++){
      (function(index, calls, gender){
        var payload = {
                        "page": "1",
                        "orgcode":"3",
                        "lsc":"",
                        "state":"",
                        "subregion":"",
                        "team": teamId,
                        "gender":gender,
                        "season": season
                      };
        var e = EVENTS[j];
        calls.push(function(callback){
          getTeamTimesForEvent(e, payload, teamId, function(err, body) {
            if (err){
              console.log("Error: ", err);
            } else {
              parseHtmlResults(body, function(err, times){
                var eventDist = e[0];
                var eventStroke = e[1]-1;
                var eventName = mapNumbersToEventName(eventDist, eventStroke);
                times.forEach(function(t) {
                  t.gender = gender;
                  t.eventName = eventName;
                });
                mongoose.model('ReferenceTime').create(times, function(err, docs) {
                  if (err) {
                    callback(err);
                  } else {
                    callback(null, true);
                  }
                });
              });
            }
          });
        });
      })(j, calls, genders[i]);
    }
  }

  mongoose.model('ReferenceTime').remove({"type": "Team"}, function(err) {
    if (err) {
      console.log("Error removing old reference times: ", err);
    } else {
      console.log("Successfully removed old reference times.");
      async.parallel(calls, function(err, result) {
        if (err){
          console.log("Something went wrong while creating reference times.");
        } else {
          console.log("Reference times successfully created.");
          console.log("Updating all recruits.");
          updateAllRecruits(true, true);
        }
      });
    }
  });
}

module.exports = getTeamTimes;
