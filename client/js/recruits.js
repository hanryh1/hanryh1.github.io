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

/**
 * Janky helper function to add recruit radio options in the case of multiple
 * matching recruits w/ same or similar names
 */
function addRecruitOptions(formSelector, recruits, gender) {
  var formHtml = '<div class="form-group">'
  for (var i = 0; i < recruits.length; i++) {
    var recruit = recruits[i];
    var csId = /\/swimmer\/([0-9]+)/.exec(recruit["url"])[1];
    formHtml += '<input type="radio" name="csId" class="recruit-radio" value=' + csId +
                '>' + recruit["name"] + " | " + recruit["location"] + " | " +
                '<a href="http://www.collegeswimming.com' + recruit["url"] + '"> Profile </a></input>';
  }
  formHtml += '</div><input type="hidden" name="gender" value=' + gender + '></input>';
  formHtml += '<button class="button btn update-btn" id="select-recruit-btn">Select</button>'
  $(formSelector).html(formHtml);
  $("#select-recruit-btn").click(function(evt){
    evt.preventDefault();
    var formData = getFormData(formSelector);
    if (!formData.csId){
      $("#select-recruit-error").text("You must select a recruit!");
      return;
    }
    formData["_csrf"] = $("#csrf").val();
    $.ajax({
      url: "/recruits/id",
      type: "POST",
      data: formData,
      success: function(){
          window.location = '/';
        },
      error: function(jqXHR, textStatus, err) {
          $("#new-recruit-error").text("Invalid ID, or something else went wrong.");
          $("#new-csId").val("");
          $("input[name=\"gender\"]")[0].checked = false;
          $("input[name=\"gender\"]")[1].checked = false;
        }
      });
  });
}

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

  $("#create-recruit-name-btn").click(function(evt){
    evt.preventDefault();
    var formData = getFormData("#add-recruit-name-form");
    if (!/^[A-Za-z\s]+$/.test(formData.recruitName)){
      $("#new-recruit-name-error").text("Please enter a valid name!");
      return;
    }
    if (!formData.gender){
      $("#new-recruit-name-error").text("You must select a gender!");
      return;
    }
    formData["_csrf"] = csrf;
    $.ajax({
      url: window.location.pathname,
      type: "POST",
      data: formData,
      success: function(){
          window.location = '/';
        },
      error: function(jqXHR, textStatus, err) {
          var response = JSON.parse(jqXHR.responseText);
          if (response.multipleResults) {
            $("#add-recruit-name").modal("hide");
            addRecruitOptions("#select-recruit-form", response.swimmers, response.gender);
            $("#select-recruit-modal").modal("show");
          } else {
            $("#new-recruit-name-error").text("This recruit does not have a profile, or something else went wrong.");
            $("#new-name").val("");
            $("input[name=\"gender\"]")[0].checked = false;
            $("input[name=\"gender\"]")[1].checked = false;
          }
        }
      });
  });

  function newQuery() {
    var classYear = $("#select-year").find("option:selected").attr("value");
    var tags = [];
    $(".select-tag:checked").each(function(i,v){
      tags.push($(this).attr("value"));
    });
    window.location = "/recruits?classYear=" + classYear + "&tags[]=" + tags.join("&tags[]=");
  }

  $("#select-year").change(newQuery);
  $(".select-tag").click(newQuery);

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

  $(".recruit-row").click(function(){
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
