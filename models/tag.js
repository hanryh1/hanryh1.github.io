var mongoose    = require('mongoose');
var please      = require('pleasejs');

var tagSchema = new mongoose.Schema({
  name: {type: 'String', required: true, index: true, unique: true, lowercase: true},
  color: {type: String, default: "#5fb5b6"}
});

tagSchema.set('autoIndex', false);

tagSchema.statics.getFullList = function(callback) {
  this.find(callback);
}

tagSchema.statics.addOrGet = function(tagName, callback) {
  var that = this;
  that.findOne({"name": tagName}).exec(function(err, tag){
    if (err) {
      callback(err);
    } else if (tag) {
      callback(null, tag)
    } else {
      that.create({name: tagName, color: please.make_color()}, callback);
    }
  });
}

module.exports = mongoose.model('Tag', tagSchema);
