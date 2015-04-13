var Recruit = require("../models/recruit");
var Time = require("../models/time");

timeController = {};

//takes in an event name and a gender
timeController.getTimesByEventAndGender = function(req, res){
    if (!req.query.eventName || !req.query.gender){
        res.status(400).send({'error': 'Missing query parameters.'});
    } else{
        var eventName = req.query.eventName;
        var gender = req.query.gender;
        console.log(eventName);
        console.log(gender);
        Time.find({"eventName": eventName}).sort({time: 1}).populate('recruit').exec(function(err, times){
            if (err){
                res.status(500).send(err);
            } else{
                console.log(times);
                var correctGender = times.filter(function(element, index, array){
                    return element.recruit.gender == gender;
                });
                res.status(200).send(correctGender);
            }
        });
    }
}

module.exports = timeController;