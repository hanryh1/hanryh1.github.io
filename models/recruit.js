var mongoose = require('mongoose');

var recruitSchema = new mongoose.Schema({
  name: {type: 'String', required: true},
  collegeSwimmingId: {type: 'Number', unique: true}, //id from collegeswimming.com
  powerIndex: {type: 'Number'},
  gender: {type: 'String', enum: ['M', 'F']},
  times: [{type: mongoose.Schema.Types.ObjectId, ref: 'Time'}],
  classYear: {type: 'Number', index: true},
  email: {type: 'String'},
  comments: {type: 'String'},
  height: {type: 'Number', min: 48, max: 96}, // in inches
  tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}]
});

recruitSchema.set('autoIndex', false);

recruitSchema.method('getHeightAsString', function() {
  if (!this.height) {
      return "";
  }
  var feet = Math.floor(this.height/12);
  var inches = this.height % 12;
  return String(feet) + "'" + String(inches) + "\"";
});

recruitSchema.method('addTag', function(tagId, callback) {
  var index = this.tags.indexOf(tagId);
  if (index == -1){
    this.tags.push(tagId);
  }
  this.save(callback);
});

recruitSchema.method('removeTag', function(tagId, callback) {
  var index = this.tags.indexOf(tagId);
  if (index != -1){
    this.tags.splice(index, 1);
  }
  this.save(callback);
});

recruitSchema.statics.getRecruitsForTagsUnion = function(tags, callback) {
  this.find({ tags: { $in: tags } }).exec(callback);
}

recruitSchema.statics.getRecruitsForTagsIntersection = function(tags, callback) {
  this.find({ tags: { $all: tags } }).exec(callback);
}

recruitSchema.statics.getFullList = function(callback) {
  this.find().distinct('name', callback);
}

recruitSchema.statics.getAllClassYears = function(callback) {
  this.find().distinct('classYear', callback);
}

module.exports = mongoose.model('Recruit', recruitSchema);

