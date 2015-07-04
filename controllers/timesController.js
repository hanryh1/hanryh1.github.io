var Recruit = require("../models/recruit");
var Time = require("../models/time");

timeController = {};

//takes in an event name and a gender
timeController.getTimesByEventAndGender = function(req, res){
    if (!req.query.eventName || !req.query.gender){
        res.status(400).send({'error': 'Missing query parameters.'});
    } else {
        var query = {"eventName": req.query.eventName}

        if (req.query.archived == 0) {
            query["archived"] =  { $ne: true };
        }
        
        var gender = req.query.gender;
        Time.find(query).sort({time: 1}).populate('recruit', 'name collegeSwimmingId gender classYear').exec(function(err, times){
            if (err){
                res.status(500).send(err);
            } else{
                var correctGender = times.filter(function(element, index, array){
                    return element.recruit.gender == gender;
                });
                res.status(200).send(correctGender);
            }
        });
    }
}

module.exports = timeController;