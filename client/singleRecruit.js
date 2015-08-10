var getFormData = function(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

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
  //enable popover
  $('[data-toggle="hover"]').popover({
        placement: 'right',
        trigger: 'hover',
        html: true
  });

  $('#times-editor').hide();
  $('#cancel-edit-times').hide();

  var csrf = $("#csrf").val();

  var activeTabSelector = ($(".archived-label").length == 1) ? "#archived-link" : "#recruits-link";

  $(activeTabSelector).addClass("active");

  $('.typeahead').typeahead({
    minLength: 1,
    highlight: true
  },
  {
    name: 'events',
    limit: 14,
    source: substringMatcher(events)
  });

  $('#new-event-select').bind('typeahead:selected', function(obj, datum, name) {
    $('#new-event-select').val(JSON.stringify(datum).replace(/['"]+/g, ""));
    selectNewEvent();
  });

  $("#update-form-btn").click(function(evt){
    $(".updateable-information").hide();
    $(".update-form-container").show();
  });

  $("#cancel-update").click(function(evt){
    $(".update-form-container").hide();
    $(".error").hide();
    $(".updateable-information").show();
  });

  $("#submit-recruit-update").click(function(evt){
    evt.preventDefault();
    var email = $("#recruit-email").val();
    var comments = $("#recruit-comments").val();
    var height = $("#recruit-height").val();
    if (!email.trim() && !comments.trim() && !height){
      $(".error").text("Not all fields can be blank.");
      return;
    }
    if (height < 48 || height > 96){
      $(".error").text("Put a real height.");
    }
    $.ajax({
      url: window.location.pathname + "/info",
      type: "PUT",
      data: { "email": email,
              "comments": comments,
              "height": height,
              "_csrf": csrf
      },
      success: function(){
          window.location.reload(true);
        }, 
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

  $("#toggle-seconds").click(function(){
    window.location = window.location.pathname;
  });

  $("#toggle-body-lengths").click(function(){
    window.location = window.location.pathname + "?bodylengths=1";
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

  $('#sidebar-toggle').click(function(){
    $('#sidebar').toggleClass("collapsed");
    $('#items').toggle();
  });

  $('#edit-times-btn').click(function(){
    $('#display-times').hide();
    $('#cancel-edit-times').show();
    $('#times-editor').show();
    $(this).hide();
  });

  $('#cancel-edit-times').click(function(){
    $('#times-editor').hide();
    $('#edit-times-btn').show();
    $('#display-times').show();
    $(this).hide();
  });

  $(".delete-time-btn").click(function(){
    var timeRow = $(this).closest("tr")
    var timeId = timeRow.attr("timeid");
    var recruitId = $("#new-time-btn").attr("recruitid");
    $.ajax({
      url: "/recruits/" + recruitId + "/times/" + timeId,
      type: "DELETE",
      data: { "_csrf": csrf },
      success: function(){
        timeRow.hide();
      }, error: function(jqXHR, textStatus, err){
        $("#edit-times-error").text("Oops, something went wrong.")
      }
    });
  })

  $("#new-time-btn").click(function(evt){
    evt.preventDefault;
    var recruitId = $(this).attr("recruitid");
    var time = $("#new-time-input").val();
    var eventName = $("#new-event-select").val();
    if (events.indexOf(eventName) == -1){
      $("#add-manual-time-error").text("Please enter a valid event.");
      return;
    }
    if (!/^([0-9]{1,2}:)?[0-9]{2}\.[0-9]{1,2}$/.test(time)){
       $("#add-manual-time-error").text("Please enter a valid time.");
       return;
    }
    $.ajax({
      url: "/recruits/" + recruitId + "/times",
      type: "POST",
      data: {"time": time, "eventName": eventName, "_csrf": csrf},
      success: function(time){
        window.location.reload(true);
      }, error: function(jqXHR, textStatus, err) {
          var errMsg = JSON.parse(jqXHR.responseText).error;
          $("#add-manual-time-error").text(errMsg || "Could not add new time.").show();
        }
    });
  });

  $(".save-time-btn").click(function(evt){
    var timeRow = $(this).closest("tr")
    var timeId = timeRow.attr("timeid");
    var eventName = timeRow.children(":first").text();
    var time = timeRow.find(".time-input").val()
    var recruitId = $("#new-time-btn").attr("recruitid");
    if (!/^([0-9]{1,2}:)?[0-9]{2}\.[0-9]{1,2}$/.test(time)){
       $("#edit-times-error").text("Please enter a valid time.");
       return;
    }
    $.ajax({
      url: "/recruits/" + recruitId + "/times/"+timeId,
      type: "PUT",
      data: {"time": time, "eventName": eventName, "_csrf": csrf},
      success: function(){
        window.location.reload(true);
      }, error: function(jqXHR, textStatus, err){
        $("#edit-times-error").text("Oops, something went wrong.")
      }
    });
  });

  // hide extraneous things so mobile doesn't look as bad
  if ($(window).width() < 480){
    $(".mobile-hidden").hide()
    $("#items").hide();
    if (!($("#sidebar").hasClass("collapsed"))){
      $('#sidebar').addClass("collapsed");
    }
  }

  $(window).resize(function(){
    if ($(window).width() < 480){
      $(".mobile-hidden").hide()
      $("#items").hide();
      if (!($("#sidebar").hasClass("collapsed"))){
        $('#sidebar').addClass("collapsed");
      }
    } else {
      $(".mobile-hidden").show()
    }
  });
});