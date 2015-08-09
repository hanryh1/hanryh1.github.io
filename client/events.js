var generateHtml = function(eventName, data){
  var newHtml = "<h3>"+eventName+"</h3><table>" +
                "<tr><th>Name</th><th>Class</th><th>Time</th>" +
                "<th>Standard</th></tr>";
  for (var i = 0; i < data.length; i++){
    var time = data[i];
    var standard = time.standard || "-";
    newHtml += "<tr><td><a href=\"/recruits/" +
               time.recruit._id+"\">" + time.recruit.name +
               "</a><td>" + time.recruit.classYear + "<td>" +
               time.timeString +"</td><td>" + standard + "</td></tr>";
  }  
  newHtml += "</table>"
  return newHtml
}

var selectNewEvent = function(){
      var selectedEvent = $("#select-event").val();
      var selectedGender = $("input[name='gender']:checked").val();
      var isArchived = $("input[name='archived']:checked").val();
      if (events.indexOf(selectedEvent) == -1){
        return;
      }
      $.ajax({
        url: "/events/rank",
        type: 'GET',
        data: {eventName: selectedEvent, gender: selectedGender, archived: isArchived},
        success: function(data){
            var newHTML = generateHtml(selectedEvent, data);
            $("#event-rank").html(newHTML);
          }, 
        error: function(jqXHR, textStatus, err) {
            $("#event-error").text("Something went wrong.");
          }
      });
}

/* Source: https://twitter.github.io/typeahead.js/examples/ */
var substringMatcher = function(strs) {
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

var events = [ "50 Y Free",
               "100 Y Free",
               "200 Y Free",
               "500 Y Free",
               "1000 Y Free",
               "1650 Y Free",
               "100 Y Back",
               "200 Y Back",
               "100 Y Breast",
               "200 Y Breast",
               "100 Y Fly",
               "200 Y Fly",
               "200 Y IM",
               "400 Y IM" ];

$(document).ready(function(){
  $.ajax({
      url: "/events/rank",
      type: 'GET',
      data: {eventName: "50 Y Free", gender: "M", archived: 0},
      success: function(data){
          var newHTML = generateHtml("50 Y Free", data);
          $("#event-rank").html(newHTML);
        }, 
      error: function(jqXHR, textStatus, err) {
          $("#event-error").text("Something went wrong.");
        }
  });

  $('.typeahead').typeahead({
    minLength: 1,
    highlight: true
  },
  {
    name: 'events',
    limit: 14,
    source: substringMatcher(events)
  });

  $('#select-event').bind('typeahead:selected', function(obj, datum, name) {
    $('#select-event').val(JSON.stringify(datum).replace(/['"]+/g, ""));
    selectNewEvent();
  });

  $('#events-link').addClass("active");
  $('#select-gender').change(selectNewEvent);
  $('#include-archive').change(selectNewEvent);

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