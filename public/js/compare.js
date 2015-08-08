var differenceInBodylengths = function(time, diff, height) {
    var avgSpeed = parseInt(time.eventName.split(" ")[0]) / time.time;
    var heightInYards = height / 36;
    return Math.abs(avgSpeed * diff / heightInYards).toFixed(2);
}

var convertNumberToString = function(timeNumber){
    var minutes = Math.floor(timeNumber/60);
    var timeString = minutes > 0 ? String(minutes)+":" : "";
    var seconds = (timeNumber % 60);
    var secondsString = String(seconds.toFixed(2));
    if (seconds < 10){
        secondsString = "0" + secondsString;
    }
    return timeString + secondsString;
}

var generateHtml = function(recruit, swimmer, data){
  var recruitTimes = data.recruitTimes;
  var referenceTimes = data.referenceTimes;
  var height = data.recruit.height;
  var recruitFirstName = recruit.split(" ")[0];
  var teamMemberFirstName = swimmer.split(" ")[0]
  var newHtml = "<a href='/recruits/" + data.recruit._id + "'><h2>" +
                recruit + "</h2></a><p><p>Compared with " +
                swimmer + "<p><table>" +
                "<tr><th>Event</th><th>" + recruitFirstName +
                "</th><th>" + teamMemberFirstName + "</th></tr>";
  for (var i = 0; i < recruitTimes.length; i++){
    var time = recruitTimes[i];
    var refTime = referenceTimes[i];
    var delta = (refTime.time - time.time).toFixed(2);
    var faster = delta > 0 ? recruitFirstName : teamMemberFirstName;
    var slower = delta > 0 ? teamMemberFirstName : recruitFirstName;
    var content = "<b>" + time.eventName + "</b><br>" + faster + " beats " + slower + " by<br>";
    content += Math.abs(delta) + " seconds";
    if (height) {
      var bodyLengths = differenceInBodylengths(time, delta, height);
      content += "<br>" + bodyLengths + " body lengths";
    }
    newHtml += "<tr class=\"compare-row\" data-toggle=\"hover\" data-placement=\"left\" data-content='" +
               content + "'><td>" + time.eventName + "</td>" +
               "<td>" + time.timeString + "</td>" +
               "<td>" + convertNumberToString(refTime.time) + "</td></tr>";
  }  
  newHtml += "</table>"
  return newHtml
}

var popoverPlacement = function(){
  return $(window).width() < 975 ? 'top' : 'left';
}

var getNewComparison = function(){
      var selectedRecruit = $("#select-recruit").find("option:selected").text();
      var selectedTeamMember = $("#select-team-member").find("option:selected").text();
      $.ajax({
        url: "/compare/times",
        type: 'GET',
        data: {recruit: selectedRecruit, teamMember: selectedTeamMember},
        success: function(data){
            var newHTML = generateHtml(selectedRecruit, selectedTeamMember, data);
            $("#comparison-results").html(newHTML);
            //enable popover
            $('[data-toggle="hover"]').popover({
                  placement: popoverPlacement,
                  trigger: 'hover',
                  html: true
            });
          }, 
        error: function(jqXHR, textStatus, err) {
            $("#error").text("Something went wrong.");
          }
      });
}

$(document).ready(function(){
    $('#compare-link').addClass("active");
    $('#select-team-member').change(getNewComparison);
    $('#select-recruit').change(getNewComparison);

    $('#logout-link').click(function(){
      $.ajax({
        url: '/logout',
        type: 'POST',
        success: function(){
          window.location = '/';
        }
      });
    });
});