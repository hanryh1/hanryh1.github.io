var helpers = {}

helpers.convertTimeToNumber = function(timeString) {
    if (timeString[0] == ":"){ //handle leading ":"
        timeString = timeString.substring(1);
    }
    var interim = timeString.split(":");
    if (interim.length > 1) {
        return parseInt(interim[0])*60 + parseFloat(interim[1]);
    } else{
        return parseFloat(interim[0]);
    }
};

helpers.convertNumberToString = function(timeNumber) {
    var minutes = Math.floor(timeNumber/60);
    var timeString = minutes > 0 ? String(minutes)+":" : "";
    var seconds = (timeNumber % 60);
    var secondsString = String(seconds.toFixed(2));
    if (seconds < 10){
        secondsString = "0" + secondsString;
    }
    return timeString + secondsString;
}

module.exports = helpers;
