var mongoose = require('mongoose');

/**
 * Settings to be set by admin.
 * There should only be one such object in the DB.
 */
var configurationSchema = new mongoose.Schema({
  defaultYear: {type: 'Number'}
});

configurationSchema.statics.getDefaultYear = function(callback) {
  this
    .findOne({})
    .select('defaultYear')
    .exec(function(err, configuration){
      var year = configuration ? configuration.defaultYear : null;
      callback(err, year);
    });
}

configurationSchema.statics.setDefaultYear = function(year, callback) {
  this
    .findOneAndUpdate({}
                      , {defaultYear: year}
                      , {upsert: true}
                      , function(err, configuration){
                        callback(err);
    });
}

module.exports = mongoose.model('Configuration', configurationSchema);
