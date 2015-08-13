function differenceInBodylengths(time, diff, height) {
  var avgSpeed = parseInt(time.eventName.split(" ")[0]) / time.time;
  var heightInYards = height / 36;
  return Math.abs(avgSpeed * diff / heightInYards).toFixed(2);
}

function convertNumberToString(timeNumber) {
  var minutes = Math.floor(timeNumber/60);
  var timeString = minutes > 0 ? String(minutes)+":" : "";
  var seconds = (timeNumber % 60);
  var secondsString = String(seconds.toFixed(2));
  if (seconds < 10){
      secondsString = "0" + secondsString;
  }
  return timeString + secondsString;
}

function generateHtml(recruit, swimmer, data){
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

function popoverPlacement(){
  return $(window).width() < 975 ? 'top' : 'left';
}

function getNewComparison(recruits, roster){
  var selectedRecruit = $("#select-recruit").val();
  var selectedTeamMember = $("#select-team-member").val();
  if (recruits.indexOf(selectedRecruit) == -1 || roster.indexOf(selectedTeamMember) == -1) {
    return;
  }
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

/* Source: https://twitter.github.io/typeahead.js/examples/ */
function substringMatcher(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

$(document).ready(function(){
  var recruits = [];
  var roster = [];

  /*
    Fetch recruit and roster list
  */
  $.ajax({
    url: '/compare/swimmers',
    type: 'GET',
    success: function(response){
      $('#compare-link').addClass("active");
      recruits = response.recruits;
      roster = response.roster;
      $('#select-team-member').typeahead({
        minLength: 1,
        highlight: true
      },
      {
        name: 'teamMembers',
        limit: 5,
        source: substringMatcher(roster)
      });

      $('#select-recruit').typeahead({
        minLength: 1,
        highlight: true
      },
      {
        name: 'recruits',
        limit: 5,
        source: substringMatcher(recruits)
      });

      $('#select-team-member').bind('typeahead:selected', function(obj, datum, name) {
        $('#select-team-member').val(JSON.stringify(datum).replace(/['"]+/g, ""));
        getNewComparison(recruits, roster);
      });

      $('#select-recruit').bind('typeahead:selected', function(obj, datum, name) {
        $('#select-recruit').val(JSON.stringify(datum).replace(/['"]+/g, ""));
        getNewComparison(recruits, roster);
      });
    },
    error: function(jqXHR, textStatus, err) {
      $("#error").text("Something went wrong.");
    }
  });

  $('#sidebar-toggle').click(function(){
    $('#sidebar').toggleClass("collapsed");
    $('#items').toggle();
  });

  if ($(window).width() < 480){
    $("#items").hide();
    if (!($("#sidebar").hasClass("collapsed"))){
      $('#sidebar').addClass("collapsed");
    }
  }

  $(window).resize(function(){
    if ($(window).width() < 480){
      $("#items").hide();
      if (!($("#sidebar").hasClass("collapsed"))){
        $('#sidebar').addClass("collapsed");
      }
    }
  });

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