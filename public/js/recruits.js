var getFormData = function(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

$(document).ready(function(){
    $(".are-you-sure").hide();
    $(".are-you-sure-archive").hide();
    $(".add-manual-time").hide();
    $("#are-you-sure-archive-all").hide();

    $("#create-recruit-btn").click(function(evt){
      evt.preventDefault();
      var formData = getFormData("#add-recruit-form");
      if (!/^[0-9]{6}$/.test(formData.csId)){
        $("#new-recruit-error").text("ID should be a 6-digit number.");
        return;
      }
      if (!formData.gender){
        $("#new-recruit-error").text("You must select a gender!");
        return;
      }
      $.ajax({
        url: window.location.pathname,
        type: "POST",
        data: formData,
        success: function(){
            window.location.reload(true);
          }, 
        error: function(jqXHR, textStatus, err) {
            $("#new-recruit-error").text("Invalid ID, or something else went wrong.");
            $("#new-csId").val("");
            $("input[name=\"gender\"]")[0].checked = false;
            $("input[name=\"gender\"]")[1].checked = false;
          }
        });
    });

    $(".delete-btn").click(function(){
        $(this).closest(".recruit-container").find(".are-you-sure").show();
    });

    $(".delete-confirm-btn").click(function(){
        var recruitId = $(this).closest(".recruit-container").attr("id").substring(10);
        $.ajax({
          url: "/recruits/" + recruitId,
          type: "DELETE",
          success: function(){
            window.location.reload(true);
          }, error: function(jqXHR, textStatus, err) {
              $("#container-" + recruitId).find(".recruit-error").text("Could not delete recruit.");
            }
        });
    });

    $(".archive-btn").click(function(){
        $(this).closest(".recruit-container").find(".are-you-sure-archive").show();
    });

    $(".archive-confirm-btn").click(function(){
        var recruitId = $(this).closest(".recruit-container").attr("id").substring(10);
        $.ajax({
          url: "/recruits/" + recruitId + "?archive=true",
          type: "PUT",
          success: function(){
            window.location.reload(true);
          }, error: function(jqXHR, textStatus, err) {
              $("#container-" + recruitId).find(".recruit-error").text("Could not archive recruit.");
            }
        });
    });

    $(".add-update-btn").click(function(){
        $(this).hide();
        $(this).closest(".recruit-container").find(".add-manual-time").show();
    });

    $(".new-time-btn").click(function(evt){
        evt.preventDefault;
        var recruitId = $(this).attr("id").substring(9);
        var time = $(this).closest(".add-manual-time").find(".new-time-input").val();
        var eventName = $(this).closest(".add-manual-time").find(".new-event-select").val();
        if (!/^([0-9]{1,2}:)?[0-9]{2}\.[0-9]{1,2}$/.test(time)){
           $("#container-" + recruitId).find(".recruit-error").text("Please enter a valid time.");
           return;
        }
        $.ajax({
          url: "/recruits/" + recruitId + "/times",
          type: "POST",
          data: {"time": time, "eventName":eventName},
          success: function(time){
            $(".error").hide();
            var timesTable = $("#container-" + recruitId).find(".table-striped");
            var nationalRank = time.nationalRank || "-";
            var teamRank = time.teamRank || "-";
            var html = timesTable.html().substring(0,timesTable.html().length-8);
            html += "<tr><td>" + time.eventName + "</td><td>"+time.timeString +
                    "</td><td>-</td><td>" + nationalRank +
                    "<td>" + teamRank + "</td></tr></table>";
            timesTable.html(html);
          }, error: function(jqXHR, textStatus, err) {
              var errMsg = JSON.parse(jqXHR.responseText).error;
              $("#container-" + recruitId).find(".recruit-error").text(errMsg || "Could not add new time.").show();
            }
        });
    });

    $(".time-cancel-btn").click(function(){
        $(this).closest(".recruit-container").find(".add-manual-time").hide();
        $(".error").hide();
        $(".add-update-btn").show();
    });

    $(".delete-time-btn").click(function(){
      var timeId = $(this).closest("tr").attr("id").substring(5);
      $.ajax({
        url: "/recruits/times/"+timeId,
        type: "DELETE",
        success: function(){
          $("#time-"+timeId).hide();
        }, error: function(jqXHR, textStatus, err){
          console.log("You messed up somehow");
        }
      });
    })

    $(".delete-deny-btn").click(function(){
      $(this).closest(".are-you-sure").hide();
    });

    $(".archive-deny-btn").click(function(){
      $(this).closest(".are-you-sure-archive").hide();
    });

    $("#archive-all-btn").click(function(){
      $("#are-you-sure-archive-all").show();
    });

    $("#archive-all-confirm-btn").click(function(){
      $.ajax({
        url: "/recruits?&archive=true",
        type: "PUT",
        success: function(){
          window.location.reload(true);
        }, error: function(jqXHR, textStatus, err) {
            $("#new-recruit-error").text("Oops, something went horribly wrong.");
          }
      });
    });

    $("#archive-all-deny-btn").click(function(){
      $("#are-you-sure-archive-all").hide();
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

    // hide extraneous things so mobile doesn't look as bad
    if ($(window).width() < 480){
        $(".mobile-hidden").hide()
    }

    $(window).resize(function(){
      if ($(window).width() < 480){
        $(".mobile-hidden").hide()
      } else {
        $(".mobile-hidden").show()
      }
    });
});