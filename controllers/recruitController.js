var Recruit = require('../models/recruit');
var request = require('request');
var Time = require('../models/time');

controller = {};

controller.getAllRecruits = function(req, res) {
    Recruit.find().populate("times").exec(function(err, recruits){
        console.log(recruits);
        if (err){
            res.render('error', {'error': error});
        } else{
            res.render('index', {'recruits': recruits});
        }
    });
};

controller.getTimesForRecruit = function(req, res){
    Time.find({"recruit": req.params.recruitId}, function(err, times){
        if (err){
            res.status(500).send(err);
        } else{
            res.status(200).send(times);
        }
    });
}

controller.getRecruit = function(req, res) {
    Recruit.findOne({'collegeSwimmingId': req.params.csId}, function(err, recruit){
        if (err){
            res.status(500).send(err);
        } else if (!recruit){
            res.status(404).send({'message': 'recruit not found'});
        } else{
            res.status(200).send(recruits);
        }
    });
};

controller.deleteRecruit = function(req, res){
    //delete a recruit
}

//get recruit's information from collegeswimming.com
controller.createRecruit = function(req, res) {
    Recruit.findOne({'collegeSwimmingId': req.body.csId}, function(err, recruit){
        if (err){
            res.status(500).send(err);
        } else if (recruit){
            res.status(200).send(recruit); //already exists, don't need to make new one
        } else {
            request('http://www.collegeswimming.com/swimmer/' + req.body.csId + '/powerindex/', function(error, response, body){
                if (error){
                    console.log(error);
                } else if (response.statusCode == 200){
                    var cheerio = require('cheerio'),
                        $ = cheerio.load(body);
                    var data = [];
                    var name = $('.profile-swimmer-name')[0].children[0].data;
                    var powerIndex = $(".public-profile-statistic").find("a").first().text()
                    $('tr').each(function(i, tr){
                        var children = $(this).children();
                        var row = {
                            "eventName": children[0].children[0].data,//innerText,
                            "time": children[1].children[0].data,
                            "points": parseInt(children[2].children[0].data)
                        };
                        data.push(row);
                    });
                    var recruit = {"name": name, "powerIndex": powerIndex, "collegeSwimmingId": req.body.csId}
                    Recruit.create(recruit, function(err, recruit){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            var numTimes = 0;
                            var times = [];
                            for (var i = 1; i < data.length; i ++){
                                var time = data[i];
                                //only care about yard times
                                if (time["eventName"].indexOf(" Y ") >= 0){
                                    time["recruit"] = recruit._id;
                                    var t = new Time(time);
                                    t.save();
                                    times.push(t);
                                    numTimes += 1;
                                }
                                if (numTimes > 5) break;
                            }
                            recruit["times"] = times;
                            recruit.save(function (err, recruit){
                                if (err) res.status(500).send(err);
                                else{
                                    res.status(200).send(recruit);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};


module.exports = controller;
