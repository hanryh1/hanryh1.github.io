var request = require("request");
/**
 * Module by which to obtain a given swimmer's CollegeSwimming ID
 */

queryHelper = {};
var BASE_URL = "http://www.collegeswimming.com/api/search/?q="

queryHelper.getQueryResults = function(name, callback) {
  request(BASE_URL + name
           , function(error, response, body) {
            if (error){
              callback(error);
            } else if (response.statusCode == 200){
              callback(null, JSON.parse(body));
            }
          });
}

module.exports = queryHelper;
