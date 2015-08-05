var differenceInBodylengths = function(time, diff, height) {
    var avgSpeed = parseInt(time.eventName.split(" ")[0]) / time.time;
    var heightInYards = height / 36;
    return Math.abs(avgSpeed * diff / heightInYards).toFixed(2);
}

var generateHtml = function(recruit, swimmer, data){
  var times = data.times;
  var deltas = data.deltas;
  var height = data.height;
  var newHtml = "<a href='/recruits/" + data.recruitId + "'><h2>" +
                recruit + "</h2></a><p><p>Compared with " +
                swimmer + "<p><table class=\"table-striped\">" +
                "<tr><th>Event</th><th>Time</th><th>Standard</th></tr>";
  for (var i = 0; i < times.length; i++){
    var time = times[i];
    newHtml += "<tr><td>" + time.eventName + "<td>";

    var delta = deltas[i];
    if (delta){
      var content = "<b>" + time.eventName + "</b><br>";
      var timeDiffMsg = delta > 0 ? delta + "s faster than " + swimmer : Math.abs(delta) + "s slower than " + swimmer;
      content += timeDiffMsg;
      if (height) {
        var bodyLengths = differenceInBodylengths(time, delta, height);
        var bodyLengthsMsg = delta > 0 ? bodyLengths + " body lengths ahead of" : bodyLengths + " body lengths behind";   
        content += "<br>" + bodyLengthsMsg + " " + swimmer;
      }
      newHtml += "<span class=\"compared\" data-toggle=\"hover\", data-content='" +
                 content + "'>" +
                 time.timeString + "</span></td>";
    } else {
      newHtml += time.timeString + "</td>";
    }
    var standard = time.standard || "-"
    newHtml += "<td>" + standard + "</td></tr>";
  }  
  newHtml += "</table>"
  return newHtml
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
                  placement: 'right',
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