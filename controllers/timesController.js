var Recruit       = require('../models/recruit');
var Time          = require('../models/time');
var EVENTS        = require('../lib/events');

controller = {};

//takes in an event name and a gender
controller.getTimesByEventGenderYear = function(req, res) {
  if (EVENTS.indexOf(req.query.eventName) == -1 || ["M", "F"].indexOf(req.query.gender) == -1 ){
    res.status(400).send({'error': 'Invalid query parameters.'});
  } else {
    var gender = req.query.gender;
    var classYear = req.query.classYear;
    Time.find({"eventName": req.query.eventName})
        .sort({time: 1})
        .populate('recruit', 'name collegeSwimmingId gender classYear')
        .exec(function(err, times) {
          if (err){
            res.status(500).send(err);
          } else{
            times = times.filter(function(element, index, array){
              return element.recruit.gender == gender;
            });
            if (classYear) {
              times = times.filter(function(element, index, array){
                return element.recruit.classYear == classYear;
              });
            }
            res.status(200).send(times);
          }
        });
  }
}

controller.renderEventsView = function(req, res) {
  Recruit.getAllClassYears(function(err, years) {
    if (err) {
      res.status(500).send(err);
    } else {
      years.sort();
      res.render('events', {events: EVENTS, classYears: years});
    }
  });
}

module.exports = controller;
