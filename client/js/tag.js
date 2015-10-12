function getFormData(form) {
  var inputs = {};
  $(form).serializeArray().forEach(function(item) {
    inputs[item.name] = item.value;
  });
  return inputs;
};

function recruitIdIndexOf(recruits, id) {
  for (var i = 0; i < recruits.length; i++) {
    if (recruits[i]._id == id) {
      return i;
    }
  }
  return -1
}

$(document).ready(function(){
  $("#recruits-link").addClass("active");
  $("#recruits-nav-link").addClass("active");

  $(".tag-label").each(function(i){
    var hex = $(this).attr('hex-color');
    $(this).css("background-color", hex);
  });

  var csrf = $("#csrf").val();

  $("#create-tag-btn").click(function(evt){
    evt.preventDefault();
    var formData = getFormData("#add-tag-form");
    formData.tagnName = formData.tagName.trim();
    if (!formData.tagName){
      $("#new-tag-error").text("Tag name should not be blank!");
      return;
    }
    formData["_csrf"] = csrf;
    $.ajax({
      url: "/recruits/tags",
      type: "POST",
      data: formData,
      success: function(){
          window.location = '/recruits/tags';
        },
      error: function(jqXHR, textStatus, err) {
          $("#new-tag-error").text("Oops, something went wrong!");
          $("#tag-name").val("");
        }
      });
  });

  $("#select-tag").change(function(){
    var tag = $(this).find("option:selected").attr("value");
    if (tag) {
      $.ajax({
        url: "/recruits/tags/" + tag,
        type: "GET",
        success: function(recruits){
          $(".tag-checkbox").each(function(i,v){
            if (recruitIdIndexOf(recruits, $(this).attr("value")) != -1){
              $(this).prop("checked", true);
            } else {
              $(this).prop("checked", false);
            }
          });
        }
      });
    }
  });

  $("#save-tags-btn").click(function(evt){
    evt.preventDefault();
    var tag = $("#select-tag").find("option:selected").attr("value");
    if (tag) {
      var update = {};
      $(".tag-checkbox").each(function(i,v){
        update[$(this).attr("value")] = $(this).prop("checked") ? 1 : 0;
      });
      $.ajax({
        url: "/recruits/tags/" + tag,
        type: "PUT",
        data: { "recruits": JSON.stringify(update), "_csrf": csrf },
        success: function(){
          window.location = '/recruits/tags';
        },
        error: function(jqXHR, textStatus, err) {
          $("#tag-error").text("Oops, something went wrong!");
        }
      });
    }
  });

  $("#select-year").change(function(){
    var classYear = $("#select-year").find("option:selected").attr("value");
    window.location = "/recruits?classYear=" + classYear;
  });

  $(".recruit-row").click(function(evt){
    var target = $(evt.target);
    if (target.hasClass("checkbox-td") || target.hasClass("tag-checkbox")){
      return;
    }
    var recruitId = $(this).attr("recruitid");
    window.location = "/recruits/" + recruitId;
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
