var Recruit = require("../models/recruit");
var csv = require("csv");
var request = require("request");
var Time = require("../models/time");
var helpers = require("./helpers");

controller = {};

var findMatchingEvent = function(events, eventName){
    for (var i=0; i < events.length; i++){
        if (events[i].eventName == eventName){
            events[i].index = i;
            return events[i];
        }
    }
    return -1;
}

// scrape collegeswimming for the stuff we want
var getRecruitData = function(collegeSwimmingId, callback) {
    request("http://www.collegeswimming.com/swimmer/" +
             collegeSwimmingId + "/powerindex/"
             , function(error, response, body){
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
                        var recruit = {
                                        "name": name, 
                                        "collegeSwimmingId": collegeSwimmingId,
                                        "classYear": classYear
                                      };
                        callback(null, recruit, data);
                    }
                }
            });           
}

// update recruit times
controller.updateTime = function(recruit, callback){
    getRecruitData(recruit.collegeSwimmingId, function(err, recruitData, data){
        if (err){
            var status = err.status == 404 ? 404 : 500;
        } else {
            Time.find({"recruit": recruit._id, "manual": true}, function(err, manualTimes){
                if (err) {
                    callback(err);
                } else {
                    var numTimes = 0;
                    var times = [];
                    for (var i = 1; i < data.length; i ++){
                        var time = data[i];
                        //only care about yard times
                        if (time.eventName.indexOf(" Y ") >= 0){
                            var manualEvent = findMatchingEvent(manualTimes, time.eventName);
                            if (manualEvent != -1){
                                if (manualEvent.time < time.time){
                                    numTimes +=1;
                                    if (numTimes > 6) break;
                                    continue;
                                } else{
                                    manualTimes[manualEvent.index].remove();
                                    manualTimes.slice(manualEvent.index,1);
                                }
                            }
                            time.recruit = recruit._id;
                            var t = new Time(time);
                            t.save();
                            times.push(t);
                            numTimes += 1;
                        }
                        if (numTimes > 6) break;
                    }
                    recruit.times = times;
                    recruit.times = recruit.times.concat(manualTimes);
                    recruit.save(function (err, recruit){
                        callback(err, recruit);        
                    });
                }
            });
        }
    });
}

controller.updatePowerIndex = function(recruit, callback){
    request("http://www.collegeswimming.com/swimmer/" + recruit.collegeSwimmingId,
        function(error, response, body){
            if (error){
                console.log(error);
            } else if (response.statusCode == 200) {
                powerIndexRegex = new RegExp("/powerindex\">[0-9]{1,2}\.[0-9]{1,2}</a>");
                powerIndex = body.match(powerIndexRegex);
                if (!powerIndex) {
                    callback({"error": "Could not get power index", "status": 500}, null);
                } else{
                    recruit.powerIndex = powerIndex[0].substring(13, powerIndex[0].length-4);
                    recruit.save(function(err, recruit){
                        callback(err, recruit);
                    });
                }
            }
    });
}

var getRecruitsByGender = function(callback){
    Recruit.find({"gender": "M", "archived": { $ne: true }})
           .sort({powerIndex:1}).populate("times")
           .exec(function(err, mRecruits){
                if (err){
                    callback(err);
                } else{
                    Recruit.find({"gender": "F", "archived": { $ne: true }})
                           .sort({powerIndex:1}).populate("times")
                           .exec(function(err, fRecruits){
                                if (err){
                                    callback(err)
                                } else{
                                    callback(err, {"maleRecruits": mRecruits,
                                                   "femaleRecruits": fRecruits});
                                }   
                            });
                }
            });
}

controller.getAllRecruits = function(req, res) {
    getRecruitsByGender(function(err, recruits) {
        if (err){
            res.render("error", {"error": err});
        } else {
            res.render("recruits", recruits);
        }
    });
};

controller.getArchivedRecruits = function(req, res) {
    var classYear = null;
    var maleQuery = {"gender": "M", "archived":true}
    var femaleQuery = {"gender": "F", "archived":true}
    if (req.params.classYear) {
        if (!/[0-9]{4}/.test(req.params.classYear)){
            return res.render("error", {"error": "Invalid class year"});
        } else {
            var classYear = parseInt(req.params.classYear);
            maleQuery["classYear"] = classYear;
            femaleQuery["classYear"] = classYear;
        }  
    }
    Recruit.find(maleQuery)
           .sort({powerIndex:1, classYear: 1})
           .populate("times")
           .exec(function(err, mRecruits){
                if (err){
                    res.render("error", {"error": error});
                } else {
                    Recruit.find(femaleQuery)
                           .sort({powerIndex:1, classYear: 1})
                           .populate("times")
                           .exec(function(err, fRecruits){
                                if (err){
                                    res.render("error", {"error": err});
                                } else{
                                     Recruit.find({"archived": "true"})
                                            .distinct("classYear"
                                            , function(err, classYears){
                                                if (err){
                                                    res.render("error", {"error": err});
                                                } else {
                                                    classYears.sort();
                                                    res.render("archived", {"maleRecruits": mRecruits, 
                                                                            "femaleRecruits": fRecruits,
                                                                            "classYears": classYears,
                                                                            "defaultYear": classYear});
                                                }
                                    });
                                }

                        });
                }
            });
};

controller.getTimesForRecruit = function(req, res){
    Time.find({"recruit": req.params.recruitId}, function(err, times){
        if (err){
            res.status(500).send(err);
        } else {
            res.status(200).send(times);
        }
    });
}

controller.deleteTime = function(req, res){
    Time.findById(req.params.timeId, function(err, time){
        if (err){
            res.status(500).send(err);
        } else if (!time){
            res.status(404).send({"error": "This time does not exist."});
        } else{
            Recruit.findById(time.recruit, function(err, recruit){
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

controller.addTimeManually = function(req, res){
    Recruit.findById(req.params.recruitId, function(err, recruit){
        if (err){
            res.status(500).send(err)
        } else {
            Time.findOne({"eventName": req.body.eventName, "recruit": recruit._id}
                , function(err, time){
                    if (err){
                        res.status(500).send(err)
                    } else {
                        var newTime = helpers.convertTimeToNumber(req.body.time);
                        if (time){
                            if (time.time <= newTime){
                                return res.status(400)
                                          .send({"error": "This time isn't faster than an existing time."});
                            } else {
                                var timeIndex = recruit.times.indexOf(time._id);
                                recruit.times.slice(timeIndex, 1);
                                recruit.save();
                                time.remove();
                            }
                        }
                        var t = new Time({ 
                                           "timeString": req.body.time,
                                           "time": newTime,
                                           "eventName": req.body.eventName,
                                           "powerPoints": 0,
                                           "manual": true,
                                           "recruit": recruit._id
                                          });
                        t.save(function(err, time){
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
    Recruit.findOne({"collegeSwimmingId": req.params.csId}, function(err, recruit){
        if (err){
            res.status(500).send(err);
        } else if (!recruit){
            res.status(404).send({"message": "recruit not found"});
        } else {
            res.status(200).send(recruits);
        }
    });
};

controller.deleteRecruit = function(req, res){
    Recruit.findById(req.params.recruitId, function(err, recruit){
        if (err) {
            res.status(500).send(err); 
        } else if (!recruit){
            res.status(404).send({"error": "This recruit does not exist!"})
        } else {
            Time.remove({"recruit": recruit._id}, function(err){
                recruit.remove();
                res.status(200).send({"message": "Recruit successfully deleted."});
            });
        }
    });
}

controller.archiveRecruit = function(req, res) {
    Recruit.findById(req.params.recruitId, function(err, recruit){
        if (err) {
            res.status(500).send(err); 
        } else if (!recruit){
            res.status(404).send({"error": "This recruit does not exist!"})
        } else {
            Time.update({"recruit": recruit._id}
                       , {$set: {"archived": req.query.archive}}
                       , {multi: true}
                       , function(err){
                            if (err) {
                                res.status(500).send(err); 
                            } else {
                                recruit.update({$set: {"archived": req.query.archive}}
                                    , function(err){
                                        if (err) {
                                            res.status(500).send(err); 
                                        } else {
                                            res.status(200)
                                               .send({"message": "Recruit successfully updated."});
                                        }
                                });
                            }
                        });
        }
    });
}

controller.archiveAllRecruits = function(req, res) {
    if (!req.query.archive){
        res.status(200).send({});
    } else {
        Recruit.update({}, {$set: {"archived": true}}, {multi: true}, function(err){
            if (err){
                res.status(500).send(err);
            } else {
                Time.update({}, {$set: {"archived": true}}, {multi: true}, function(err){
                    if (err){
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({"message": "Recruits successfully archived."});
                    }
                });
            }
        });
    }
}

//get recruit's information from collegeswimming.com
controller.createRecruit = function(req, res) {
    Recruit.findOne({"collegeSwimmingId": req.body.csId}, function(err, recruit){
        if (err){
            res.status(500).send(err);
        } else if (recruit){
            res.status(200).send(recruit); //already exists, don"t need to make new one
        } else {
            getRecruitData(req.body.csId, function(err, recruit, data){
                if (err){
                    var status = err.status == 404 ? 404 : 500;
                } else {
                    recruit.gender = req.body.gender;
                    Recruit.create(recruit, function(err, recruit){
                        if (err){
                            res.status(500).send(err);
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
                                if (times.length > 6) break;
                            }
                            recruit.times = times;
                            recruit.save(function (err, recruit){
                                if (err) res.status(500).send(err);
                                else{
                                    controller.updatePowerIndex(recruit, function(err, r){
                                        if (err){
                                            res.status(500).send(err);
                                        } else{
                                            res.status(201).send(r);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });

        }
    });
};

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

var generateCsvRow = function(recruit, data) {
    var row = [recruit.name, recruit.powerIndex];
    for (var i = 0; i < EVENTS.length; i++){
        for (var j = 0; j < recruit.times.length; j++){
            if (recruit.times[j].eventName == EVENTS[i]){
                row.push(recruit.times[j].timeString);
                break;
            }
        }
        if (row.length - 2 == i) {
            row.push("");
        }
    }
    data.push(row);
}
var generateRecruitCsv = function(callback){
    getRecruitsByGender(function(err, recruits){
        if (err) {
            callback(err);
        } else {
            var headers = ["Name", "Power Points"].concat(EVENTS);
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

controller.downloadRecruitCsv = function(req, res){
    generateRecruitCsv(function(err, data){
        if (err){
            res.status(500).send(err)
        } else {
            res.attachment('recruits.csv');
            csv().from(data).to(res);
        }
    });
}

module.exports = controller;
