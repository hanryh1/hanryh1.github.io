function getFormData(form) {
  var inputs = {};
  $(form).serializeArray().forEach(function(item) {
    inputs[item.name] = item.value;
  });
  return inputs;
};

function convertTimeToNumber(timeString) {
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

/**
 * Custom Sorting Functions
 */

var EVENTS = [ "50 Y Free",
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

jQuery.fn.dataTableExt.oSort["event-asc"] = function(a, b){
  return EVENTS.indexOf(a) - EVENTS.indexOf(b);
};

jQuery.fn.dataTableExt.oSort["event-desc"] = function(a, b){
  return jQuery.fn.dataTableExt.oSort["event-asc"](b, a);
};

jQuery.fn.dataTableExt.oSort["points-asc"] = function(a, b){
  var a = parseInt(a);
  var b = parseInt(b);
  return isNaN(a) ? 1 : isNaN(b) ? -1 : a - b;
};

jQuery.fn.dataTableExt.oSort["points-desc"] = function(a, b){
  return jQuery.fn.dataTableExt.oSort["points-asc"](b, a);
}

jQuery.fn.dataTableExt.oSort["team-asc"] = function(a, b){
  var regex = new RegExp(">([0-9]{1,2})</span>");
  var x = a.match(regex);
  var y = b.match(regex);
  return x ? ( y ? parseInt(x[1]) - parseInt(y[1]) : -1 ) : 1
};

jQuery.fn.dataTableExt.oSort["team-desc"] = function(a, b){
  return jQuery.fn.dataTableExt.oSort["team-asc"](b, a);
}

var standardMap = {
                    "A":   1,
                    "Inv": 2,
                    "B":   3,
                    "-":   4
                  };

jQuery.fn.dataTableExt.oSort["standard-asc"] = function(a, b){
  return standardMap[a] - standardMap[b];
};

jQuery.fn.dataTableExt.oSort["standard-desc"] = function(a, b){
  return jQuery.fn.dataTableExt.oSort["standard-asc"](b, a);
}

jQuery.fn.dataTableExt.oSort["time-desc"] = function(a, b){
  return convertTimeToNumber(a) - convertTimeToNumber(b);
};

jQuery.fn.dataTableExt.oSort["time-asc"] = function(a, b){
  return jQuery.fn.dataTableExt.oSort["time-desc"](b, a);
}

$(document).ready(function(){
  //enable popover
  $('[data-toggle="hover"]').popover({
        placement: 'right',
        trigger: 'hover',
        html: true
  });

  var tableOptions = {
    dom: 't',
    columnDefs: [{
      "targets": [0],
      "type": "event"
    },
    {
      "targets": [1],
      "type": "time"
    },
    {
      "targets": [2,4],
      "type": "points"
    },
    {
      "targets": [3],
      "type": "team"
    },
    {
      "targets": [5],
      "type": "standard"
    }]
  }

  $('.single-recruit-times').dataTable(tableOptions);

  $('#times-editor').hide();
  $('#cancel-edit-times').hide();
  $('.bodylengths').hide();

  var csrf = $("#csrf").val();

  $("#recruits-link").addClass("active");
  $("#recruits-nav-link").addClass("active");

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
    if (height && (height < 48 || height > 96)){
      $(".error").text("Put a real height.");
      return;
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
    if (!$(this).hasClass("active")){
      $(this).addClass("active");
    }
    $("#toggle-body-lengths").removeClass("active");
    $(".bodylengths").hide();
    $(".seconds").show();
  });

  $("#toggle-body-lengths").click(function(){
    if (!$(this).hasClass("active")){
      $(this).addClass("active");
    }
    $("#toggle-seconds").removeClass("active");
    $(".seconds").hide();
    $(".bodylengths").show();
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
    var eventName = $('#new-event-select').find("option:selected").text();
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
