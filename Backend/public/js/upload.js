let urlImages = [],
  urlContainer = document.querySelector(".url-img-show");

const addProduct = async (data) => {
  try {
    await $.ajax({
      url: "/api/v1/products",
      method: "post",
      data,
      processData: false,
      contentType: false,
      beforeSend: function () {
        $("#action_button").attr("disabled", "disabled");
      },
      success: (data) => {
        $("#action_button").attr("disabled", false);
        $("#sample_form")[0].reset();
        $("#action_modal").modal("hide");
        reloadData();
        showAlert("success", "Add Product successfully!");
      },
    });
  } catch (error) {
    $("#action_button").attr("disabled", false);
    return showAlert("error", error.responseJSON.message);
  }
};
const editProduct = async (data) => {
  try {
    const id = $("#id").val();
    await $.ajax({
      url: `/api/v1/products/${id}`,
      method: "patch",
      data,
      processData: false,
      contentType: false,
      beforeSend: function () {
        $("#action_button").attr("disabled", "disabled");
      },
      success: (data) => {
        $("#action_button").attr("disabled", false);
        $("#action_modal").modal("hide");
        $("#sample_form")[0].reset();
        reloadData();
        showAlert("success", "Edit Product successfully!");
      },
    });
  } catch (error) {
    $("#action_button").attr("disabled", false);
    return showAlert("error", error.responseJSON.message);
  }
};
$("#sample_form").on("submit", async (e) => {
  e.preventDefault();

  // Validation inventory
  const inventory = parseInt($("#inventory").val());
  if (inventory < 0) {
    showAlert("error", "Số lượng tồn kho phải là số dương");
    return;
  }
  if (inventory > 1000) {
    showAlert("error", "Số lượng tồn kho không được vượt quá 1000");
    return;
  }

  // Validation weight
  const weight = parseFloat($("#weight").val());
  if (weight < 0) {
    showAlert("error", "Trọng lượng phải là số dương");
    return;
  }
  if (weight >= 1000) {
    showAlert("error", "Trọng lượng phải nhỏ hơn 1000");
    return;
  }

  // No file upload handling needed
  tinyMCE.triggerSave();
  let form_data = new FormData($("form")[0]);
  const action = $("#action").val();
  if (action === "Add") {
    addProduct(form_data);
  } else {
    editProduct(form_data);
  }
});

// URL Images functionality
function validateImageUrl(url) {
  console.log("Validating URL:", url);

  // Basic URL validation
  try {
    new URL(url);
    console.log("URL is valid");
  } catch {
    console.log("URL is invalid");
    return false;
  }

  // Check if it's an image URL - look for image extensions before query parameters
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?|$)/i;
  const isImage = imageExtensions.test(url);
  console.log("Is image URL:", isImage);
  console.log("Extension match:", url.match(imageExtensions));

  return isImage;
}

function showUrlImages() {
  if (!urlContainer) return;

  urlContainer.innerHTML = urlImages.reduce((prev, curr, index) => {
    return `${prev}
      <div class="image position-relative d-inline-block m-2">
        <span onclick="delUrlImage(${index})" class="position-absolute top-0 end-0 bg-danger text-white rounded-circle" style="width: 20px; height: 20px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">&times;</span>
        <img src="${curr}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;" onerror="this.src='/images/unnamed.jpg';" />
      </div>`;
  }, "");
}

function delUrlImage(index) {
  urlImages.splice(index, 1);
  showUrlImages();
}

// Add URL input field
document.getElementById("addUrlInput")?.addEventListener("click", function () {
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

  // Show remove buttons if more than 1 input
  updateRemoveButtons();
});

// Update remove buttons visibility
function updateRemoveButtons() {
  const removeButtons = document.querySelectorAll(".remove-url-btn");
  removeButtons.forEach((btn, index) => {
    btn.style.display = removeButtons.length > 1 ? "block" : "none";
  });
}

// Remove URL input field
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-url-btn")) {
    e.target.closest(".input-group").remove();
    updateRemoveButtons();
  }
});

// Add URL Images button event
document.getElementById("addUrlImages")?.addEventListener("click", function () {
  const urlInputs = document.querySelectorAll(".url-input");
  const urls = Array.from(urlInputs)
    .map((input) => input.value.trim())
    .filter((url) => url);

  console.log("Parsed URLs:", urls);

  if (urls.length === 0) {
    showAlert("error", "Vui lòng nhập ít nhất một URL ảnh");
    return;
  }

  const validUrls = [];
  const invalidUrls = [];

  urls.forEach((url) => {
    const isValid = validateImageUrl(url);
    console.log(`URL: ${url}, Valid: ${isValid}`);

    if (isValid) {
      validUrls.push(url);
    } else {
      invalidUrls.push(url);
    }
  });

  console.log("Valid URLs:", validUrls);
  console.log("Invalid URLs:", invalidUrls);

  if (invalidUrls.length > 0) {
    showAlert("error", `Các URL không hợp lệ: ${invalidUrls.join(", ")}`);
  }

  if (validUrls.length > 0) {
    urlImages = [...urlImages, ...validUrls];
    showUrlImages();
    // Clear all URL inputs
    urlInputs.forEach((input) => (input.value = ""));
    showAlert("success", `Đã thêm ${validUrls.length} ảnh từ URL`);
  } else if (invalidUrls.length === 0) {
    showAlert("error", "Không có URL hợp lệ nào được tìm thấy");
  }
});

// Prevent image paste in URL inputs
document.addEventListener("paste", function (e) {
  if (e.target.classList.contains("url-input")) {
    e.preventDefault();

    // Get text from clipboard
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData("text/plain");

    if (pastedText) {
      // Insert text at cursor position
      const cursorPos = e.target.selectionStart;
      const textBefore = e.target.value.substring(0, cursorPos);
      const textAfter = e.target.value.substring(e.target.selectionEnd);
      e.target.value = textBefore + pastedText + textAfter;

      // Set cursor position after pasted text
      const newCursorPos = cursorPos + pastedText.length;
      e.target.setSelectionRange(newCursorPos, newCursorPos);
    }
  }
});

// Update form submission to include URL images
const originalFormSubmit = document.querySelector("#sample_form").onsubmit;
document.querySelector("#sample_form").addEventListener("submit", function (e) {
  // Add URL images to form data
  if (urlImages.length > 0) {
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "urlImages";
    hiddenInput.value = JSON.stringify(urlImages);
    this.appendChild(hiddenInput);
  }
});
