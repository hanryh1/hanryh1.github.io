function generateHtml(eventName, data) {
  if (data.length == 0){
    return "<h3 class='centered'>No times matched your query :(</h3>"
  }
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

function selectNewEvent() {
  var selectedEvent = $("#select-event").find("option:selected").val();
  var selectedGender = $("input[name='gender']:checked").val();
  var selectedYear = $("#select-year").find("option:selected").val();
  $.ajax({
    url: "/events/rank",
    type: 'GET',
    data: {eventName: selectedEvent, gender: selectedGender, classYear: selectedYear},
    success: function(data){
        var newHTML = generateHtml(selectedEvent, data);
        $("#event-rank").html(newHTML);
      },
    error: function(jqXHR, textStatus, err) {
        $("#event-error").text("Something went wrong.");
      }
  });
}

$(document).ready(function(){
  $.ajax({
      url: "/events/rank",
      type: 'GET',
      data: {eventName: "50 Y Free", gender: "M"},
      success: function(data){
          var newHTML = generateHtml("50 Y Free", data);
          $("#event-rank").html(newHTML);
          $('#events-link').addClass("active");
          $('#events-nav-link').addClass("active");
        },
      error: function(jqXHR, textStatus, err) {
          $("#event-error").text("Something went wrong.");
        }
  });

  $('#select-event').change(selectNewEvent);
  $('#select-gender').change(selectNewEvent);
  $('#select-year').change(selectNewEvent);

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
