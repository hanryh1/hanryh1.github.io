var generateHtml = function(eventName, data){
  var newHtml = "<h2>"+eventName+"</h2><table class=\"table-striped\">" +
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
      var selectedEvent = $("#select-event").find("option:selected").text();
      var selectedGender = $("input[name='gender']:checked").val();
      var isArchived = $("input[name='archived']:checked").val();
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

    $('#events-link').addClass("active");
    $('#select-event').change(selectNewEvent);
    $('#select-gender').change(selectNewEvent);
    $('#include-archive').change(selectNewEvent);

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