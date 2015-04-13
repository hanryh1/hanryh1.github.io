var helpers = {}

helpers.convertTimeToNumber = function(timeString){
    var interim = timeString.split(":");
    if (interim.length > 1) {
        return parseInt(interim[0])*60 + parseFloat(interim[1]);
    } else{
        return parseFloat(interim[0]);
    }
};

helpers.convertNumberToString = function(timeNumber){
    var minutes = Math.floor(timeNumber/60);
    var timeString = minutes > 0 ? toString(minutes) : "";
    return timeString + toString(timeNumber % 60);
}

module.exports = helpers;