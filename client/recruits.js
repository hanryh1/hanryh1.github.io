var getFormData = function(form) {
  var inputs = {};
  $(form).serializeArray().forEach(function(item) {
    inputs[item.name] = item.value;
  });
  return inputs;
};

$(document).ready(function(){
  $(".add-manual-time").hide();

  $("#recruits-link").addClass("active");

  var csrf = $("#csrf").val();

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
    formData["_csrf"] = csrf;
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

  $(".delete-recruit-btn").click(function(evt){
    evt.stopPropagation();
    var recruitRow = $(this).closest(".recruit-row");
    var recruitName = recruitRow.find(".name").text();
    $("#delete-recruit-message").text("Are you sure you want to delete " + recruitName + "?");
    $("#delete-confirm-btn").attr("recruitid", recruitRow.attr("recruitid"));
    $("#are-you-sure-delete").modal("show");
  });

  $("#delete-confirm-btn").click(function(){
    var recruitId = $(this).attr("recruitid");
    $.ajax({
      url: "/recruits/" + recruitId,
      type: "DELETE",
      data: { "_csrf": csrf },
      success: function(){
        window.location.reload(true);
      }, error: function(jqXHR, textStatus, err) {
          $("#recruit-error").text("Could not delete recruit.");
        }
    });
  });

  $(".archive-recruit-btn").click(function(evt){
    evt.stopPropagation();
    var recruitRow = $(this).closest(".recruit-row");
    var recruitId = recruitRow.attr("recruitid");
    $.ajax({
      url: "/recruits/" + recruitId + "?archive=true",
      type: "PUT",
      data: { "_csrf": csrf },
      success: function(){
        recruitRow.remove();
      }, error: function(jqXHR, textStatus, err) {
          $("#recruit-error").text("Could not archive recruit.");
        }
    });
  });

  $(".recruit-row").click(function(){
    var recruitId = $(this).attr("recruitid");
    window.location = "/recruits/" + recruitId;
  });

  $("#archive-all-confirm-btn").click(function(){
    $.ajax({
      url: "/recruits?&archive=true",
      type: "PUT",
      data: { "_csrf": csrf },
      success: function(){
        window.location.reload(true);
      }, error: function(jqXHR, textStatus, err) {
          $("#new-recruit-error").text("Oops, something went horribly wrong.");
        }
    });
  });

  $('#sidebar-toggle').click(function(){
    $('#sidebar').toggleClass("collapsed");
    $('#items').toggle();
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

