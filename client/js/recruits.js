function getFormData(form) {
  var inputs = {};
  $(form).serializeArray().forEach(function(item) {
    inputs[item.name] = item.value;
  });
  return inputs;
};

jQuery.fn.dataTableExt.oSort["name-asc"] = function(a, b){
  return a < b ? -1 : 1;
};

jQuery.fn.dataTableExt.oSort["name-desc"] = function(a, b){
  var a = a.split(" ");
  var b = b.split(" ");
  return a[a.length - 1] > b[b.length - 1] ? 1 : -1;
};

$(document).ready(function(){

  var tableOptions = {
    dom: 't',
    bPaginate: false,
    order: [[2, 'asc']],
    columnDefs: [{
      "targets": [-1],
      "orderable": false
    },
    {
      "targets": [0],
      "type": "name"
    }]
  };

  var maleTable = $('.male-recruits').dataTable(tableOptions);
  var femaleTable = $('.female-recruits').dataTable(tableOptions);

  $(".add-manual-time").hide();

  $("#recruits-link").addClass("active");
  $("#recruits-nav-link").addClass("active");

  $(".tag-label").each(function(i){
    var hex = $(this).attr('hex-color');
    $(this).css("background-color", hex);
  });

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
      url: window.location.pathname + '/id',
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

  function newQuery() {
    var classYear = $("#select-year").find("option:selected").attr("value");
    var tags = [];
    // check whether to take the union of labels instead of the intersection
    var union = $("input[name='union']:checked").val();
    $(".select-tag:checked").each(function(i,v){
      tags.push($(this).attr("value"));
    });
    window.location = "/recruits?classYear=" + classYear + "&tags[]=" + tags.join("&tags[]=") + "&union=" + union;
  }

  $("#select-year").change(newQuery);
  $(".select-tag").click(newQuery);
  $("#select-union").change(newQuery);

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

  $(".recruit-row").click(function(evt){
    var target = $(evt.target);
    if (target.hasClass("star-rating") || target.hasClass("rating-star")){
      return;
    }
    var recruitId = $(this).attr("recruitid");
    window.location = "/recruits/" + recruitId;
  });

    $(".rating-star").mouseenter(function(){
    var value = $(this).attr("star-value");
    var parent = $(this).closest(".star-rating");
    var stars = parent.children();
    for (var i = 0; i < value; i ++){
      var child = $(stars[i]);
      if (!child.hasClass("rating-star-active")){
        child.addClass("rating-star-active");
      }
    }
    for (var i = value; i < 5; i++){
      var child = $(stars[i]);
      if (child.hasClass("rating-star-active")){
        child.removeClass("rating-star-active");
      }
    }
  });

  /* Reset to normal when mouse leaves without clicking */
  $(".rating-star").mouseleave(function(){
    var parent = $(this).closest(".star-rating");
    var originalValue = parent.attr("current-value");
    var stars = parent.children();
    for (var i = 0; i < originalValue; i ++){
      var child = $(stars[i]);
      if (!child.hasClass("rating-star-active")){
        child.addClass("rating-star-active");
      }
    }
    for (var i = originalValue; i < 5; i++){
      var child = $(stars[i]);
      if (child.hasClass("rating-star-active")){
        child.removeClass("rating-star-active");
      }
    }
  });

  $(".rating-star").click(function(){
    var value = $(this).attr("star-value");
    var parent = $(this).closest(".star-rating");
    var recruitId = $(this).closest(".recruit-row").attr("recruitid");
    $.ajax({
      url: "/recruits/" + recruitId + "/rating",
      type: "PUT",
      data: {"rating": value, "_csrf": csrf},
      success: function(){
        parent.attr("current-value", value);
      }, error: function(jqXHR, textStatus, err){
        $("#error").text("Oops, something went wrong.");
      }
    })
  });

  $('.logout-link').click(function(evt){
    evt.preventDefault();
    console.log(evt.target);
    $.ajax({
      url: '/logout',
      type: 'POST',
      success: function(){
        window.location = '/';
      }
    });
  });
});

