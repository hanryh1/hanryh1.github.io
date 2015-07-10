var getFormData = function(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

$(document).ready(function(){
  //enable popover
  $('[data-toggle="hover"]').popover({
        placement: 'right',
        trigger: 'hover',
        html: true
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
    if (!email.trim() && !comments.trim()){
      $(".error").text("Both fields cannot be blank.");
      return;
    }
    $.ajax({
      url: window.location.pathname + "/info",
      type: "PUT",
      data: { "email": email,
              "comments": comments
      },
      success: function(){
          window.location.reload(true);
        }, 
      error: function(jqXHR, textStatus, err) {
          $(".error").text("Oops, something went wrong.");
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