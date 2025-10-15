const err_src = "/images/unnamed.jpg";
const loadData = async () => {
  try {
    // const arr = ["_id", "name", "price", "slug"];

    // let thead = `<thead><tr>`;
    // arr.forEach((value, index) => {
    //   thead += `<th>${value}</th>`;
    // });
    // thead += "</tr></thead>";
    // $("#sample_data").append(thead);
    // const { data } = await $.ajax({ url: "/api/v1/products/" });
    // let html = "<tbody>";

    // data.data.forEach((val, ind) => {
    //   val.arr = arr;
    //   html += `<tr>`;
    //   arr.forEach((value, index) => {
    //     html += `<td>${val[value]}</td>`;
    //   });
    //   html += `</tr>`;
    // });
    // html += "</tbody>";
    // $("#sample_data").append(html);
    $("#sample_data").DataTable({
      processing: true,
      serverSide: true,
      serverMethod: "get",
      ajax: {
        url: "api/v1/products/getTableProduct",
      },
      columns: [
        {
          data: "images",
          render: function (data) {
            return (
              `<img src="` +
              data[0] +
              `" alt=""height="65" width="65" onerror="this.src='` +
              err_src +
              `';" style="border-radius: 0.275rem;" >`
            );
          },
        },
        {
          data: "title",
          render: function (data) {
            const value = data.length > 39 ? data.slice(0, 40) + "..." : data;
            return '<div class= "my-3">' + value + "</div>";
          },
        },

        {
          data: "price",
          render: function (data) {
            return '<div class= "my-3">' + data + " VND</div>";
          },
        },
        {
          data: "inventory",
          render: function (data) {
            return '<div class= "my-3">' + data + "</div>";
          },
        },
        {
          data: null,
          render: function (row) {
            let btnEdit =
              '<button type="button" class="btn btn-primary btn-sm mr-1 edit" data-id="' +
              row.id +
              '"><i class="fa fa-edit"></i></button>';
            let btnDelete =
              '<button type="button" class="btn btn-danger btn-sm delete" data-id="' +
              row.id +
              '"><i class="fa fa-trash-alt"></i></button></div>';
            return `<div class= "my-3">${btnEdit}${btnDelete}</div>`;
          },
        },
      ],
    });

    showAlert("success", "Load Data successfully!");
  } catch (err) {
    showAlert("error", err);
  }
};
const loadCategory = function () {
  $.ajax({
    url: "/api/v1/categories",
    method: "GET",
    success: (data) => {
      $("#category").empty();
      data.data.data.forEach((value) => {
        $("#category").append(
          "<option value=" + value.id + ">" + value.name + "</option>"
        );
      });
    },
  });
};
const loadBrand = function () {
  $.ajax({
    url: "/api/v1/brands",
    method: "GET",
    success: (data) => {
      $("#brand").empty();
      data.data.data.forEach((value) => {
        $("#brand").append(
          "<option value=" + value.id + ">" + value.name + "</option>"
        );
      });
    },
  });
};
function reloadData() {
  $("#sample_data").DataTable().ajax.reload();
}

// Helper functions for URL inputs
function addUrlInputField() {
  const urlInputs = document.getElementById("urlInputs");
  const newInputGroup = document.createElement("div");
  newInputGroup.className = "input-group mb-2";
  newInputGroup.innerHTML = `
    <input
      type="url"
      class="form-control url-input"
      placeholder="https://example.com/image.jpg"
      spellcheck="false"
      autocomplete="off"
    />
    <button
      type="button"
      class="btn btn-outline-danger remove-url-btn"
    >
      ×
    </button>
  `;
  urlInputs.appendChild(newInputGroup);
}

function updateRemoveButtons() {
  const removeButtons = document.querySelectorAll(".remove-url-btn");
  removeButtons.forEach((btn, index) => {
    btn.style.display = removeButtons.length > 1 ? "block" : "none";
  });
}

$(document).ready(async function () {
  $("select").select2({
    theme: "bootstrap-5",
  });
  loadData();
  loadCategory();
  loadBrand();
  $(".navbar-nav li").removeClass("active");
  // $(".nav-item")[0].addClass('active');
  $(".navbar-nav li")[3].className = "nav-item active";

  // Remove URL input field event listener
  $(document).on("click", ".remove-url-btn", function () {
    $(this).closest(".input-group").remove();
    updateRemoveButtons();
  });
});
$("#add_data").click(function () {
  $("#dynamic_modal_title").text("Add Product");
  $("#sample_form")[0].reset();
  $("#category").val(null).trigger("change");
  $("#brand").val(null).trigger("change");
  $("#demand").val(null).trigger("change");
  $("#color").val(null).trigger("change");
  $("#inventory").val("");
  $("#action").val("Add");
  $("#id").val("");

  $("#action_button").text("Add");
  $(".url-img-show").empty();
  $(".mb-2").show();

  $("#action_modal").modal("show");
});
$(document).on("click", ".edit", function () {
  $("#sample_form")[0].reset();
  const id = $(this).data("id");

  $("#dynamic_modal_title").text("Edit Product");

  $("#action").val("Edit");

  $("#action_button").text("Edit");

  $("#action_modal").modal("show");
  $(".mb-2").hide();
  $(".url-img-show").empty();
  $(".edit-show").show();

  // Clear URL inputs first
  $(".url-input").val("");

  $.ajax({
    url: `/api/v1/products/${id}`,
    method: "GET",
    success: function (data) {
      const product = data.data.data;
      $("#id").val(id);
      $("#title").val(product.title);
      $("#category").val(product.category.id).trigger("change");
      $("#brand").val(product.brand.id).trigger("change");
      $("#demand").val(product.demand).trigger("change");
      $("#color").val(product.color).trigger("change");
      $("#price").val(product.price);
      $("#promotion").val(product.promotion);
      $("#weight").val(product.weight);
      $("#inventory").val(product.inventory);
      $("#ram").val(product.ram);
      $("#battery").val(product.battery);
      $("#cpu").val(product.cpu);
      $("#os").val(product.os);
      $("#screen").val(product.screen);
      $("#graphicCard").val(product.graphicCard);

      tinymce.get("description").setContent(product.description);

      // Load product images into URL inputs
      if (product.images && product.images.length > 0) {
        // Clear existing URL inputs except the first one
        $(".url-input").slice(1).closest(".input-group").remove();

        // Set first URL input
        $(".url-input").first().val(product.images[0]);

        // Add additional URL inputs for remaining images
        for (let i = 1; i < product.images.length; i++) {
          addUrlInputField();
          $(".url-input").last().val(product.images[i]);
        }

        // Update remove buttons visibility
        updateRemoveButtons();

        // Load images into urlImages array and display them
        urlImages = [...product.images];
        console.log("Loaded urlImages for edit:", urlImages);
        showUrlImages();
      } else {
        // Clear URL inputs if no images
        $(".url-input").val("");
        urlImages = [];
        showUrlImages();
      }
    },
  });
});
$(document).on("click", ".delete", function () {
  const id = $(this).data("id");

  if (confirm("Are you sure you want to delete this data?")) {
    try {
      $.ajax({
        url: `/api/v1/products/${id}`,
        method: "delete",
        success: function (data) {
          showAlert("success", `Delete Product ${id} Successfully`);
          reloadData();
        },
      });
    } catch (error) {
      return showAlert("error", error.responseJSON.message);
    }
  }
});
