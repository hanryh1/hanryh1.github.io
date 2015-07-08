var getFormData = function(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

$(document).ready(function(){
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
      data: {"meetUrl": url},
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
});