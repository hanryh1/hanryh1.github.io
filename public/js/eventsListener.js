var generateHtml = function(eventName, data){
  var newHtml = "<h2>"+eventName+"</h2><table class=\"table-striped\"><tr><th>Recruit Name</th><th>Time</th></tr>";
  for (var i = 0; i < data.length; i++){
    var time = data[i];
    newHtml += "<tr><td><a href=\"http://www.collegeswimming.com/swimmer/"+time.recruit.collegeSwimmingId+"\">" + time.recruit.name+"</a></td><td>" + time.timeString +"</td></tr>"
  }  
  newHtml += "</table>"
  return newHtml
}
$(document).ready(function(){
    $.ajax({
        url: "/events/rank",
        type: 'GET',
        data: {eventName: "50 Y Free", gender: "M"},
        success: function(data){
            var newHTML = generateHtml("50 Y Free", data);
            $("#event-rank").html(newHTML);
          }, 
        error: function(jqXHR, textStatus, err) {
            $("#event-error").text("Something went wrong.");
          }
    });

    $('#get-event-rank-btn').click(function(){
      var selectedEvent = $("#select-event").find("option:selected").text();
      var selectedGender = $("#select-gender").find("option:selected").text()[0];
      $.ajax({
        url: "/events/rank",
        type: 'GET',
        data: {eventName: selectedEvent, gender: selectedGender},
        success: function(data){
            var newHTML = generateHtml("50 Y Free", data);
            $("#event-rank").html(newHTML);
          }, 
        error: function(jqXHR, textStatus, err) {
            $("#event-error").text("Something went wrong.");
          }
        });
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