$(document).ready(function(){
    $(".are-you-sure").hide();

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
      console.log(formData);
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
              $("#new-recruit-error").text("Could not delete recruit.");
            }
        })
    });

    $(".delete-deny-btn").click(function(){
      $(this).closest(".are-you-sure").hide();
    });
});