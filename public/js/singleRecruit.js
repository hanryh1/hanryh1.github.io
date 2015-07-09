var getFormData = function(form) {
    var inputs = {};
    $(form).serializeArray().forEach(function(item) {
      inputs[item.name] = item.value;
    });
    return inputs;
};

$(document).ready(function(){
    $("#update-form-btn").click(function(evt){
      $(".updateable-information").hide();
      $(".update-form-container").show();
    });

    $("#cancel-update").click(function(evt){
      $(".update-form-container").hide();
      $(".updateable-information").show();
    });

    $("#submit-recruit-update").click(function(evt){
      evt.preventDefault();
      var email = $("#recruit-email").val();
      var comments = $("#recruit-comments").val();
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
});