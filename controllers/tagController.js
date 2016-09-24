var async               = require('async');
var Promise             = require('bluebird');
var Recruit             = require('../models/recruit');
var Tag                 = require('../models/tag');

var getRecruitsByGender = require('./recruitController').getRecruitsByGender;


var controller = {};

controller.getTagPage = function(req, res) {
  var getAllTags = new Promise(function(f, r){
    Tag.getFullList(function(err, tags){
      if (err) {
        r(err);
      } else {
        f(tags);
      }
    })
  });

  var getRecruits = new Promise(function(f, r){
    getRecruitsByGender({$ne: null}, {classYear: -1, name:1}, function(err, recruits){
      if (err) {
        r(err);
      } else {
        f(recruits);
      }
    });
  });

  Promise
    .all([getAllTags, getRecruits])
      .catch(function(err){
        res.status(500).send(err);
      })
      .then(function(results){
          res.render("tag", { "tags": results[0],
                              "recruits": results[1],
                              "csrf": req.csrfToken()});
      });
}

controller.addOrGetTag = function(req, res) {
  Tag.addOrGet(req.body.tagName, function(err, tag){
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(tag);
    }
  });
}

/*
 * Post body is an object mapping recruits whose tag status need to be changed
 */
controller.updateRecruitTags = function(req, res) {
  Tag.findById(req.params.tagId, function(err, tag){
    if (err) {
      res.status(500).send(err);
    } else if (!tag){
      res.status(404).send({"error": "This tag does not exist!"});
    } else {
      var recruitObj = JSON.parse(req.body.recruits);
      Recruit.find({"_id": {$in: Object.keys(recruitObj)}}, function(err, recruits){
        var updates = [];
        for (var i = 0; i < recruits.length; i++) {
          (function(i){
            updates.push(function(callback){
              var recruit = recruits[i];
              if (recruitObj[recruit._id]) {
                recruit.addTag(tag._id, callback);
              } else {
                recruit.removeTag(tag._id, callback)
              }
            });
          })(i);
        }
        async.parallel(updates, function(err, result) {
          if (err){
            console.log(err);
            res.status(500).send(err);
          } else {
            res.status(200).send({"message": "Recruit tags successfully updated."});
          }
        });
      });
    }
  });
}

controller.deleteTag = function(req, res) {
  Recruit.findById(req.params.recruitId, function(err, r){
    if (err) {
      res.status(500).send(err);
    } else if (!r){
      res.status(404).send({"error": "This recruit does not exist!"});
    } else {
      r.removeTag(req.params.tagId, function(err, recruit){
        if (err) {
          res.status(500).send(err);
        } else {
          res.status(200).send({"message": "Tag successfully deleted."});
        }
      });
    }
  });
}

controller.getRecruitsForTag = function(req, res) {
  Recruit.getRecruitsForTagsUnion([req.params.tagId], function(err, recruits){
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(recruits);
    }
  });
}

module.exports = controller;
