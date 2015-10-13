var csv           = require("csv");
var Promise       = require("bluebird");
var request       = require("request");

var helpers       = require("../lib/helpers");
var EVENTS        = require("../lib/events");
var QueryHelper   = require("../lib/queryHelper");

var Configuration = require("../models/configuration");
var Recruit       = require("../models/recruit");
var Tag           = require("../models/tag");
var Time          = require("../models/time");

var controller = {};

function findMatchingEvent(events, eventName) {
  for (var i=0; i < events.length; i++){
    if (events[i].eventName == eventName){
      events[i].index = i;
      return events[i];
    }
  }
  return -1;
}

// scrape collegeswimming for the stuff we want
function getRecruitData(collegeSwimmingId, callback) {
  request("http://www.collegeswimming.com/swimmer/" +
           collegeSwimmingId + "/powerindex/"
           , function(error, response, body) {
            if (error){
              callback(error);
            } else if (response.statusCode == 200){
              var cheerio = require("cheerio"),
                $ = cheerio.load(body);
              if ($(".page404").length > 0){
                callback({"error": "Recruit not found", "status": 404});
              } else{
                var data = [];
                var name = $(".swimmer-name").text().trim();
                var classYear = parseInt($(".swimmer-class").find("strong").text()) + 4;
                $("tr").each(function(i, tr){
                  var children = $(this).children();
                  var row = {
                      "eventName": children[0].children[0].data,
                      "time": helpers.convertTimeToNumber(children[1].children[0].data),
                      "timeString": children[1].children[0].data,
                      "points": parseInt(children[2].children[0].data)
                  };
                  data.push(row);
                });
                var recruit = { "name": name,
                                "collegeSwimmingId": collegeSwimmingId,
                                "classYear": classYear };
                callback(null, recruit, data);
              }
            }
          });
}

// update recruit times
function updateTime(recruit, callback) {
  getRecruitData(recruit.collegeSwimmingId, function(err, recruitData, data) {
    if (err){
        var status = err.status == 404 ? 404 : 500;
    } else {
      Time.find({"recruit": recruit._id}, function(err, oldTimes) {
        if (err) {
          callback(err);
        } else {
          var times = [];
          for (var i = 1; i < data.length; i ++){
            var time = data[i];
            //only care about yard times
            if (EVENTS.indexOf(time.eventName) >= 0){
              var oldTime = findMatchingEvent(oldTimes, time.eventName);
              if (oldTime != -1){
                if (oldTime.time <= time.time){
                  continue;
                } else{
                  oldTime.time = time.time;
                  oldTime.points = time.points;
                  oldTime.timeString = time.timeString;
                  oldTime.manual = false;
                  oldTime.save();
                }
              } else {
                time.recruit = recruit._id;
                var t = new Time(time);
                t.save();
                times.push(t);
              }
            }
          }
          recruit.times = times.concat(oldTimes);
          recruit.save(function (err, recruit) {
            callback(err, recruit);
          });
        }
      });
    }
  });
}

function updatePowerIndex(recruit, callback) {
  request("http://www.collegeswimming.com/swimmer/" + recruit.collegeSwimmingId,
    function(error, response, body) {
      if (error){
        console.log(error);
      } else if (response.statusCode == 200) {
        powerIndexRegex = new RegExp("/powerindex\">[0-9]{1,2}\.[0-9]{1,2}</a>");
        powerIndex = body.match(powerIndexRegex);
        if (!powerIndex) {
          callback({"error": "Could not get power index", "status": 500}, null);
        } else{
          recruit.powerIndex = powerIndex[0].substring(13, powerIndex[0].length-4);
          recruit.save(function(err, recruit) {
            callback(err, recruit);
          });
        }
      }
  });
}

/**
*Various functions to query for recruits
**/
function getRecruitsByGender(year, callback) {
  var getMales = new Promise(function(f, r) {
    Recruit
      .find({"gender": "M", "classYear": year})
      .sort({powerIndex:1}).populate("times tags")
      .exec(function(err, recruits){
          if (err){
            r(err);
          } else {
            f(recruits);
          }
        });
  });

  var getFemales = new Promise(function(f, r) {
      Recruit
        .find({"gender": "F", "classYear": year})
        .sort({powerIndex:1}).populate("times tags")
        .exec(function(err, recruits){
            if (err){
              r(err);
            } else {
              f(recruits);
            }
        });
  });

  Promise
    .all([getMales, getFemales])
      .catch(function(err){
        callback(err);
      })
      .then(function(results){
          callback(null, { "maleRecruits": results[0],
                           "femaleRecruits": results[1] });
      });
}

controller.getRecruitsByGender = getRecruitsByGender;

/**
 * Helper function to get the right class year
 * to use for the query
 */
function getClassYear(input, callback) {
  if (input) {
    if (input == "all") {
      return callback(null, null);
    } else if (!/[0-9]{4}/.test(input)){
      callback({"error": "Invalid class year"});
    } else {
      callback(null, parseInt(input));
    }
  } else {
    Configuration.getDefaultYear(callback);
  }
}

controller.getAllRecruits = function(req, res) {
  getClassYear(req.query.classYear, function(err, year){
    var selectedTags = req.query.tags;
    var maleQuery = year ? {gender:"M", classYear: year} : {gender:"M"};
    var femaleQuery = year ? {gender:"F", classYear: year} : {gender:"F"};
    // Check if first entry is empty string ( no tags )
    if (selectedTags && selectedTags.length != 0 && selectedTags[0].length != 0) {
      if (req.query.union == 1) {
        maleQuery.tags = { $in: selectedTags };
       femaleQuery.tags = { $in: selectedTags };
      } else {
        maleQuery.tags = { $all: selectedTags };
        femaleQuery.tags = { $all: selectedTags };
      }
    }
    var getMales = new Promise(function(f, r) {
      Recruit
        .find(maleQuery)
        .sort({powerIndex:1, classYear: 1})
        .populate("times tags")
        .exec(function(err, recruits) {
          if (err){
            r(err);
          } else {
            f(recruits);
          }
        });
    });

    var getFemales = new Promise(function(f, r) {
      Recruit
        .find(femaleQuery)
        .sort({powerIndex:1, classYear: 1})
        .populate("times tags")
        .exec(function(err, recruits) {
          if (err){
            r(err);
          } else {
            f(recruits);
          }
        });
    });

    var getClassYears = new Promise(function(f, r) {
      Recruit
        .getAllClassYears(function(err, years) {
          if (err) {
            r(err);
          } else {
            years.sort();
            f(years);
          }
        });
    });

    var getTags = new Promise(function(f, r) {
        Tag
          .getFullList(function(err, tags) {
            if (err) {
              r(err);
            } else {
              f(tags);
            }
          });
    });

    Promise
      .all([getMales, getFemales, getClassYears, getTags])
        .then(function(results) {
          var tags = results[3];
          // woo double for loop
          if (selectedTags){
            for (var i = 0; i < tags.length; i++){
              for (var j = 0; j < selectedTags.length; j++){
                if (selectedTags[j] == tags[i]._id) {
                  tags[i].checked = true;
                  break;
                }
              }
            }
          }
          res.render("recruits", { "maleRecruits": results[0],
                                   "femaleRecruits": results[1],
                                   "classYears": results[2],
                                   "tags": tags,
                                   "union": req.query.union,
                                   "defaultYear": year,
                                   "isAdmin": req.session.admin,
                                   "csrf": req.csrfToken() });
        });
  });
}

controller.getTimesForRecruit = function(req, res) {
  Time.find({"recruit": req.params.recruitId}, function(err, times) {
    if (err){
      res.status(500).send(err);
    } else {
      res.status(200).send(times);
    }
  });
}

controller.createRecruitByName = function(req, res) {
  QueryHelper.getQueryResults(req.body.recruitName, function(err, results){
    if (err){
      res.status(500).send(err);
    } else {
      if (results.length == 0) {
        res.status(404).send({"message": "No matching recruits found."});
      } else if (results.length == 1){
        var recruit = results[0];
        var csId = /\/swimmer\/([0-9]+)/.exec(recruit["url"])[1];
        createRecruit(csId, req.body.gender, function(err, recruit){
          if (err) {
            res.status(500).send(err);
          } else {
            res.status(201).send(recruit);
          }
        });
      } else {
        res.status(400).send({"multipleResults": true,
                              "swimmers": results,
                              "gender": req.body.gender});
      }
    }
  });
}

/**
* Functions to modify a recruit's times
*/
controller.deleteTime = function(req, res) {
  Time.findById(req.params.timeId, function(err, time) {
    if (err){
      res.status(500).send(err);
    } else if (!time){
      res.status(404).send({"error": "This time does not exist."});
    } else{
      Recruit.findById(time.recruit, function(err, recruit) {
        if (err){
          res.status(500).send(err);
        } else if (!recruit){
          res.status(500).send({"error": "This time does not belong to a recruit."});
        } else{
          var timeIndex = recruit.times.indexOf(time._id);
          recruit.times.splice(timeIndex, 1);
          recruit.save(function(err){
            if (err){
              res.status(500).send(err);
            } else{
              time.remove();
              res.status(200).send({"message": "Time successfully deleted."});
            }
          });
        }
      });
    }
  });
}

controller.addTimeManually = function(req, res, requireFaster) {
  if (EVENTS.indexOf(req.body.eventName) == -1){
      return res.status(400).send({"error": "This is not a real event."});
  }
  var newTime = helpers.convertTimeToNumber(req.body.time);
  if (newTime < 15) {
      return res.status(400).send({"error": "This does not seem like a real time."});
  }
  Recruit.findById(req.params.recruitId, function(err, recruit) {
    if (err){
      res.status(500).send(err)
    } else {
      Time.findOne({"eventName": req.body.eventName, "recruit": recruit._id}
          , function(err, time) {
            if (err){
              res.status(500).send(err)
            } else {
              if (time){
                if (requireFaster && time.time <= newTime){
                  return res.status(400)
                            .send({"error": "This time isn't faster than an existing time."});
                } else {
                  var timeIndex = recruit.times.indexOf(time._id);
                  recruit.times.slice(timeIndex, 1);
                  recruit.save();
                  time.remove();
                }
              }
              var t = new Time({ "timeString": req.body.time,
                                 "time": newTime,
                                 "eventName": req.body.eventName,
                                 "powerPoints": 0,
                                 "manual": true,
                                 "recruit": recruit._id });
              t.save(function(err, time) {
                if (err){
                  res.status(500).send(err);
                } else{
                  recruit.times.push(time._id);
                  recruit.save(function(err, r){
                    if (err){
                      res.status(500).send(err);
                    } else{
                      res.status(201).send(time);
                    }
                  });
                }
              });
            }
          });
      }
  });
}

controller.getRecruit = function(req, res) {
  Recruit
    .findById(req.params.recruitId)
    .populate("times tags")
    .exec(function(err, recruit) {
      if (err){
        res.status(500).send(err);
      } else if (!recruit){
        res.status(404).send({"message": "recruit not found"});
      } else {
        Time.populate(recruit.times,
                      {path: "behind inFrontOf", model: "ReferenceTime"},
                      function(err, times) {
                        recruit.times = times;
                        res.render("single-recruit",
                                   { "recruit": recruit,
                                     "timeToString": helpers.convertNumberToString,
                                     "csrf": req.csrfToken() });
                      });
      }
    });
};

controller.deleteRecruit = function(req, res) {
  Recruit.findById(req.params.recruitId, function(err, recruit) {
    if (err) {
      res.status(500).send(err);
    } else if (!recruit){
      res.status(404).send({"error": "This recruit does not exist!"})
    } else {
      Time.remove({"recruit": recruit._id}, function(err) {
        recruit.remove();
        res.status(200).send({"message": "Recruit successfully deleted."});
      });
    }
  });
}

controller.updateRecruit = function(req, res) {
  if (!req.body.email && !req.body.comments && !req.body.height && req.body.rating){
    return res.status(400).send({"error": "Not all fields can be blank!"});
  }
  Recruit
    .findOneAndUpdate({ _id: req.params.recruitId},
                      { email: req.body.email,
                        comments: req.body.comments,
                        rating: req.body.rating,
                        height: req.body.height },
                        function(err, recruit) {
                          if (err){
                            res.status(500).send(err);
                          } else {
                            res.status(200)
                               .send({"message": "Update successful."});

                          }
                        });
}

function createRecruit(collegeSwimmingId, gender, callback) {
  Recruit.findOne({"collegeSwimmingId": collegeSwimmingId}, function(err, recruit) {
      if (err){
        callback(err);
      } else if (recruit){
        callback(null, recruit); //already exists, don"t need to make new one
      } else {
        getRecruitData(collegeSwimmingId, function(err, recruit, data) {
          if (err){
            var status = err.status == 404 ? 404 : 500;
          } else {
            recruit.gender = gender;
            Recruit.create(recruit, function(err, recruit) {
              if (err){
                callback(err);
              } else {
                var times = [];
                for (var i = 1; i < data.length; i ++){
                  var time = data[i];
                  //only care about yard times
                  if (time.eventName.indexOf(" Y ") >= 0){
                    time.recruit = recruit._id;
                    var t = new Time(time);
                    t.save();
                    times.push(t);
                  }
                }
                recruit.times = times;
                recruit.save(function (err, recruit) {
                  if (err) res.status(500).send(err);
                  else{
                    updatePowerIndex(recruit, callback);
                  }
                });
              }
            });
          }
        });
      }
  });
}

//get recruit's information from collegeswimming.com
controller.createRecruit = function(req, res) {
  createRecruit(req.body.csId, req.body.gender, function(err, r) {
    if (err){
      res.status(500).send(err);
    } else{
      res.status(201).send(r);
    }
  });
};


/**
* CSV Generation
**/
function generateCsvRow(recruit, data) {
  var row = [recruit.name, recruit.email, recruit.getHeightAsString(), recruit.powerIndex];
  for (var i = 0; i < EVENTS.length; i++){
    for (var j = 0; j < recruit.times.length; j++){
      if (recruit.times[j].eventName == EVENTS[i]){
        row.push(recruit.times[j].timeString);
        break;
      }
    }
    if (row.length - 4 == i) { //number of non-time headers
      row.push("");
    }
  }
  var tags = recruit.tags.map(function(t){
    return t.name;
  });
  row.push(recruit.rating);
  row.push(tags.join(", "));
  data.push(row);
}

function generateRecruitCsv(year, callback) {
  getRecruitsByGender(year, function(err, recruits) {
    if (err) {
      callback(err);
    } else {
      var headers = ["Name", "Email", "Height", "Power Points"].concat(EVENTS).concat(["Rating", "Tags"]);
      var data = [headers, ["Men"]];
      for (var i = 0; i < recruits.maleRecruits.length; i ++){
        generateCsvRow(recruits.maleRecruits[i], data);
      }
      data = data.concat([[""],["Women"]])
      for (var i = 0; i < recruits.femaleRecruits.length; i ++){
        generateCsvRow(recruits.femaleRecruits[i], data);
      }
      callback(null, data);
    }
  });
}

controller.downloadRecruitCsv = function(req, res) {
  Configuration.getDefaultYear(function(err, year) {
    if (err) {
      res.status(500).send(err);
    } else {
      generateRecruitCsv(year, function(err, data) {
        if (err){
          res.status(500).send(err)
        } else {
          res.attachment('recruits.csv');
          csv().from(data).to(res);
        }
      });
    }
  });
}

controller.updateTime = updateTime;
controller.updatePowerIndex = updatePowerIndex;

module.exports = controller;
