var async                    = require("async");
var request                  = require("request");

var eventMap                 = require("../lib/eventMap");
var EVENTS                   = require("../lib/events");
var helpers                  = require("../lib/helpers");
var updateAllRecruits        = require("../lib/updateRecruits").updateAllRecruits;
var updateTeamReferenceTimes = require("../lib/updateTeamReferenceTimes");

var Configuration            = require('../models/configuration');
var Recruit                  = require('../models/recruit');
var ReferenceTime            = require('../models/referenceTime');
var StandardTime             = require('../models/standardTime');

controller = {}

/* Controller for getting times to compare against requiring some extra configuration */

controller.updateTeamReferenceTimes = function(req, res) {
  if (!req.body.teamId || !req.body.season){
    return res.status(400).send({"error":"Missing parameters."});
  }
  res.status(200).send({"error": "Starting update"});
  updateTeamReferenceTimes(req.body.teamId, req.body.season);
}

//// Functions for getting times from meets ////

// This is necessary because cheerio is weird
function generateSelector(rowIndex, columnIndex) {
  return "tr:nth-child(" + rowIndex + ") > td:nth-child(" +
         columnIndex + ")";
}

function getTimesFromTable(eventName, $) {
  var times = [];
  var isMile = eventName.indexOf("1650") != -1;
  // no finals, get top 16
  var numFinals = isMile ? 1 : 2;
  // timed finals, so get 4th column instead
  var prelimsCol = 4;
  var finalsCol = 5;
  for (var j = 0; j < numFinals; j++){
    for (var i = 1; i < 16/numFinals + 1; i++){
      var time = {
                    "time": helpers.convertTimeToNumber($($("tbody")[j]).find(generateSelector(i, prelimsCol) + " > abbr ").text().trim()),
                    "eventName": eventName.substring(2),
                    //"rank": parseInt($(tableBodies[i-1]).find(generateSelector(i, 1)).text().trim()),
                    "gender": eventName[0],
                    "type": "NationalsPrelims"
                  }
      times.push(time);
    }
  }
  times.sort(function(a, b){
    return a.time - b.time;
  });
  // assign prelim rankings
  for (var i = 0; i < times.length; i++){
    times[i]["rank"] = i+1;
  }
  for (var j = 0; j < numFinals; j++){
    for (var i = 1; i < 16 - 16/numFinals + 1; i++){
      var time = {
                    "time": helpers.convertTimeToNumber($($("tbody")[j]).find(generateSelector(i, finalsCol) + " > abbr ").text().trim()),
                    "eventName": eventName.substring(2),
                    "rank": parseInt($($("tbody")[j]).find(generateSelector(i, 1)).text().trim()),
                    "gender": eventName[0],
                    "type": "NationalsFinals"
                  }
      if (!isNaN(time.rank)){ // if someone gets DQed this won't be correct
        times.push(time);
      }
    }
  }
  return times;
}

function getTimesForEvent(eventName, eventIndex, meetUrl, callback) {
  var url = meetUrl + "/event/" + eventIndex + "/";
  request(url, function(error, response, body) {
    if (error){
      callback(error);
    } else if (response.statusCode == 200){
      var cheerio = require("cheerio"),
        $ = cheerio.load(body);
      var data = getTimesFromTable(eventName, $);
      callback(null, data);
    } else {
      console.log("URL: " + url);
      console.log("Status code: " + response.statusCode);
      callback({"error": "Could not get page."});
    }
  });
}

controller.setDefaultYear = function(req, res) {
  var year = parseInt(req.body.year);
  Recruit.getAllClassYears(function(err, years){
    if (err) {
      res.status(500).send(err);
    } else if (years.indexOf(year) == -1){
      res.status(400).send({"error":"There are no recruits with this class year."});
    } else {
      Configuration.setDefaultYear(year, function(err){
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).send({"message": "Updated successfully."});
        }
      });
    }
  });
}

controller.createReferenceTimesForMeet = function(req, res) {
  if (!req.body.meetUrl) {
    res.status(400).send({"error":"Missing url."});
  } else {
    var map = new Date().getFullYear() % 2 == 0 ? eventMap.evenYear : eventMap.oddYear;
    var calls = [];
    for (var ev in map) {
      if (map.hasOwnProperty(ev)) {
        (function(eventName, eventIndex, meetUrl, calls){
          calls.push(function(callback){
            getTimesForEvent(eventName, eventIndex, meetUrl, function(err, times) {
              if (err){
                callback(err);
              } else {
                ReferenceTime.create(times, function(err, t) {
                  if (err){
                    console.log("Error occured with:", eventName);
                    console.log(times);
                    callback(err);
                  } else {
                    callback(null, true);
                  }
                });
              }
            });
          });
        }(ev, map[ev], req.body.meetUrl, calls));
      }
    }
    ReferenceTime.remove({"type": {$in: ["Nationals", "NationalsPrelims", "NationalsFinals"]}}, function(err) {
      if (err) {
        res.status(500).send({"error": "Error removing old times"});
      } else {
        res.status(200).send({"message": "Generating times now"});
        async.parallel(calls, function(err, result) {
          if (err){
            console.log(err);
            console.log("Something went wrong while creating times for meet.");
          } else {
            console.log("Times successfully created");
            console.log("Updating all recruit times");
            updateAllRecruits(true);
          }
        });
      }
    });
  }
}

//// Functions for making time standards ////

// converts casing to Xxxxx format
function toTitleCase(str) {
  if (str == "IM") return str;
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

controller.createTimeStandards = function(req, res) {
  if (!req.body.timeStandards || !req.body.gender) {
    return res.status(400).send({"error": "Missing parameters."});
  }
  var types = StandardTime.schema.path("type").enumValues;
  var lines = req.body.timeStandards.match(/[^\r\n]+/g);
  var standards = [];
  for (var i = 0; i < lines.length; i++){
    var tokens = lines[i].split(" ");
    var eventName = tokens[0] + " Y " + toTitleCase(tokens[1]);
    if (EVENTS.indexOf(eventName) == -1){
      continue; //it's not an event we care about
    }
    for (var j = 2; j < 5; j++){
      var standard = {
                       "time": helpers.convertTimeToNumber(tokens[j]),
                       "type": types[j-2],
                       "gender": req.body.gender,
                       "eventName": eventName
                      };
      standards.push(standard);
    }
  }
  StandardTime.remove({"gender": req.body.gender}, function(err) {
    if (err){
      res.status(500).send(err);
    } else {
      StandardTime.create(standards, function(err) {
        if (err){
          res.status(500).send(err);
        } else {
          res.status(201).send({"message": "New standards created."});
          console.log("Updating all recruit times");
          updateAllRecruits(true);
        }
      });
    }
  });
}

// admin interface to updating all the recruits so we don't have to wait until every monday
controller.updateAllRecruits = function(req, res) {
  res.status(200).send({"message": "Starting update"});
  updateAllRecruits(true);
}

module.exports = controller;
