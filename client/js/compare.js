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

function generateHtml(recruit, swimmer, data, isRecruit) {
  if (data.recruitTimes.length == 0){
    return "<h3 class='centered'> No matching events found :(</h3>"
  }
  var recruitTimes = data.recruitTimes;
  var referenceTimes = data.referenceTimes;
  var height = data.recruit.height;
  var recruitFirstName = recruit.split(" ")[0];
  var comparisonFirstName = swimmer.split(" ")[0];
  var recruitHtml = "<a href='/recruits/" + data.recruit._id + "'><h2>" +
                recruit + "</h2></a><p>Compared with ";
  var swimmerHtml = isRecruit ? "<a href='recruits/'" + data.referenceRecruit._id +
                    "'>" + swimmer + "</a>" : swimmer;
  var newHtml = recruitHtml + swimmerHtml + "</p><table>" +
                 "<tr><th>Event</th><th>" + recruitFirstName +
                 "</th><th>" + comparisonFirstName + "</th></tr>";
  for (var i = 0; i < recruitTimes.length; i++) {
    var time = recruitTimes[i];
    var refTime = referenceTimes[i];
    var delta = (refTime.time - time.time).toFixed(2);
    var faster = delta > 0 ? recruitFirstName : comparisonFirstName;
    var slower = delta > 0 ? comparisonFirstName : recruitFirstName;
    var content = "<b>" + time.eventName + "</b><br>" + faster + " beats " + slower + " by<br>" +
                  Math.abs(delta) + " seconds";
    if (height) {
      var bodyLengths = differenceInBodylengths(time, delta, height);
      content += "<br>" + bodyLengths + " body lengths";
    }

    newHtml += "<tr class='compare-row' data-toggle='hover' data-container='body' data-placement='left' data-content='" +
               content + "'><td>" + time.eventName + "</td>";
    var timeElem = delta > 0 ? "<td class='faster'>" + time.timeString + "</td>" : "<td>" + time.timeString + "</td>"
    var refTimeString = convertNumberToString(refTime.time);
    var refTimeElem = delta > 0 ? "<td>" + refTimeString + "</td></tr>" : "<td class='faster'>" + refTimeString + "</td></tr>"
    newHtml += timeElem + refTimeElem;
  }
  newHtml += "</table>"
  return newHtml
}

function popoverPlacement(){
  return $(window).width() < 975 ? 'top' : 'left';
}

function getTeamMemberComparison(recruits, roster){
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

function getRecruitComparison(recruits) {
  var selectedRecruit = $("#select-recruit").val();
  var selectedComparisonRecruit = $("#select-another-recruit").val();
  if (recruits.indexOf(selectedRecruit) == -1 || recruits.indexOf(selectedComparisonRecruit) == -1 ) {
    return;
  }
  if (selectedRecruit == selectedComparisonRecruit) {
    return;
  }
    $.ajax({
    url: "/compare/recruit-times",
    type: 'GET',
    data: {recruit: selectedRecruit, comparisonRecruit: selectedComparisonRecruit},
    success: function(data){
        var newHTML = generateHtml(selectedRecruit, selectedComparisonRecruit, data, true);
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
  var recruits = [];
  var roster = [];

  var lastSelectionWasRecruit = false;

  /*
    Fetch recruit and roster list
  */
  $.ajax({
    url: '/compare/swimmers',
    type: 'GET',
    success: function(response){
      $('#compare-link').addClass("active");
      $('#compare-nav-link').addClass("active");

      recruits = response.recruits;
      roster = response.roster;

      var recruitSource = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: recruits
      });

      var rosterSource = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: roster
      });

      var comparisonRecruitSource = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: recruits
      });

      $('#select-team-member').typeahead({
        hint: true,
        minLength: 1,
        highlight: true,
        autoselect: true
      },
      {
        name: 'teamMembers',
        limit: 5,
        source: rosterSource
      }).on('keyup', this, function (event) {
        if (event.keyCode == 13) {
          var suggestions = $(".tt-dataset-teamMembers > .tt-selectable");
          if (suggestions.length == 1){
            suggestions.trigger("click");
          }
        }
      });

      $('#select-recruit').typeahead({
        hint: true,
        minLength: 1,
        highlight: true
      },
      {
        name: 'recruits',
        limit: 5,
        source: recruitSource
      }).on('keyup', this, function (event) {
        if (event.keyCode == 13) {
          var suggestions = $(".tt-dataset-recruits > .tt-selectable");
          if (suggestions.length == 1){
            suggestions.trigger("click");
          }
        }
      });

      $('#select-another-recruit').typeahead({
        hint: true,
        minLength: 1,
        highlight: true
      },
      {
        name: 'comparisonRecruits',
        limit: 5,
        source: comparisonRecruitSource
      }).on('keyup', this, function (event) {
        if (event.keyCode == 13) {
          var suggestions = $(".tt-dataset-comparisonRecruits > .tt-selectable");
          if (suggestions.length == 1){
            suggestions.trigger("click");
          }
        }
      });

      $('#select-team-member').bind('typeahead:selected', function(obj, datum, name) {
        $('#select-team-member').val(JSON.stringify(datum).replace(/['"]+/g, ""));
        getTeamMemberComparison(recruits, roster);
        lastSelectionWasRecruit = false;
      });

      $('#select-recruit').bind('typeahead:selected', function(obj, datum, name) {
        $('#select-recruit').val(JSON.stringify(datum).replace(/['"]+/g, ""));
        if (lastSelectionWasRecruit) {
          getRecruitComparison(recruits, roster);
        } else {
          getTeamMemberComparison(recruits, roster);
        }
      });

      $('#select-another-recruit').bind('typeahead:selected', function(obj, datum, name) {
        $('#select-another-recruit').val(JSON.stringify(datum).replace(/['"]+/g, ""));
        getRecruitComparison(recruits);
        lastSelectionWasRecruit = true;
      });
    },
    error: function(jqXHR, textStatus, err) {
      $("#error").text("Something went wrong.");
    }
  });

  $('.logout-link').click(function(evt){
    evt.preventDefault();
    $.ajax({
      url: '/logout',
      type: 'POST',
      success: function(){
        window.location = '/';
      }
    });
  });
});
