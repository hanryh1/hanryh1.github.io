function getFormData(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

$(document).ready(function(){
  var csrf = $("#csrf").val();

  $("#submit-meet-link").click(function(evt){
    evt.preventDefault();
    var url = $("#meet-url").val();
    if (!/^http:\/\/www.collegeswimming.com\/results\/[0-9]{5,6}$/.test(url)){
      $(".error").text("Invalid meet URL.");
      return;
    }
    $.ajax({
      url: "/admin/config/meet",
      type: "POST",
      data: {"meetUrl": url, "_csrf": csrf},
      success: function(){
          window.location.reload(true);
        },
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

  $("#submit-time-standards").click(function(evt){
    evt.preventDefault();
    var standards = $("#time-standards").val();
    if (!standards.trim()){
      return;
    }
    var gender = $("#select-gender").val();
    $.ajax({
      url: "/admin/config/standards",
      type: "POST",
      data: {"timeStandards": standards, "gender": gender},
      success: function(){
          window.location.reload(true);
        },
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

  $("#submit-team-info").click(function(evt){
    evt.preventDefault();
    var teamId = $("#team-id").val();
    var season = $("#select-season").val();
    if (!/^[0-9]+$/.test(teamId)){
      $(".error").text("Invalid Team Id");
    }
    $.ajax({
      url: "/admin/config/team",
      type: "POST",
      data: {"teamId": teamId, "season": season, "_csrf": csrf},
      success: function(){
          window.location.reload(true);
        },
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

  $("#update-default-year-btn").click(function(evt){
    evt.preventDefault();
    var year = $("#default-year").val();
    $.ajax({
      url: "/admin/config/year",
      type: "POST",
      data: {"year": year, "_csrf": csrf},
      success: function(){
          window.location.reload(true);
        },
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

  $("#update-all-recruits-btn").click(function(){
    $.ajax({
      url: "/admin/recruits",
      type: "POST",
      data: { "_csrf": csrf },
      success: function(){
          window.location.reload(true);
        },
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
        }
      });
  });

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
