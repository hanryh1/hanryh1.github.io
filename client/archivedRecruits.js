$(document).ready(function(){
  $(".are-you-sure").hide();
  $(".are-you-sure-archive").hide();
  $("#archived-link").addClass("active");

  $("#select-year").change(function(){
    var classYear = $("#select-year").find("option:selected").attr("value");
    window.location = "/recruits/archived/" + classYear;
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
      success: function(){
        window.location.reload(true);
      }, error: function(jqXHR, textStatus, err) {
          $("#recruit-error").text("Could not delete recruit.");
        }
    });
  });

  $(".unarchive-recruit-btn").click(function(evt){
    evt.stopPropagation();
    var recruitRow = $(this).closest(".recruit-row");
    var recruitId = recruitRow.attr("recruitid");
    $.ajax({
      url: "/recruits/" + recruitId + "?archive=false",
      type: "PUT",
      success: function(){
        recruitRow.remove();
      }, error: function(jqXHR, textStatus, err) {
          $("#archive-error").text("Could not unarchive recruit.");
        }
    });
  });

  $('#sidebar-toggle').click(function(){
    $('#sidebar').toggleClass("collapsed");
    $('#items').toggle();
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