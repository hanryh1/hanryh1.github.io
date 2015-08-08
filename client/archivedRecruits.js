$(document).ready(function(){
    $(".are-you-sure").hide();
    $(".are-you-sure-archive").hide();
    $("#archived-link").addClass("active");

    $("#select-year").change(function(){
      var classYear = $("#select-year").find("option:selected").attr("value");
      window.location = "/recruits/archived/" + classYear;
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

    $(".unarchive-btn").click(function(){
        var recruitId = $(this).closest(".recruit-container").attr("id").substring(10);
        $.ajax({
          url: "/recruits/" + recruitId + "?archive=false",
          type: "PUT",
          success: function(){
            window.location.reload(true);
          }, error: function(jqXHR, textStatus, err) {
              $("#container-" + recruitId).find(".recruit-error").text("Could not unarchive recruit.");
            }
        });
    });

    $(".delete-deny-btn").click(function(){
      $(this).closest(".are-you-sure").hide();
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