const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signup");

// Password toggle functionality
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    const passwordField = document.getElementById("password");
    const passwordIcon = document.getElementById("passwordIcon");

    if (passwordField.type === "password") {
      passwordField.type = "text";
      passwordIcon.classList.remove("fa-eye");
      passwordIcon.classList.add("fa-eye-slash");
    } else {
      passwordField.type = "password";
      passwordIcon.classList.remove("fa-eye-slash");
      passwordIcon.classList.add("fa-eye");
    }
  });

document
  .getElementById("togglePasswordConfirm")
  .addEventListener("click", function () {
    const passwordConfirmField = document.getElementById("passwordConfirm");
    const passwordConfirmIcon = document.getElementById("passwordConfirmIcon");

    if (passwordConfirmField.type === "password") {
      passwordConfirmField.type = "text";
      passwordConfirmIcon.classList.remove("fa-eye");
      passwordConfirmIcon.classList.add("fa-eye-slash");
    } else {
      passwordConfirmField.type = "password";
      passwordConfirmIcon.classList.remove("fa-eye-slash");
      passwordConfirmIcon.classList.add("fa-eye");
    }
  });

// Validation functions
function validateName(name) {
  if (!name || name.trim().length < 3) {
    return "Họ tên phải có ít nhất 3 ký tự";
  }
  if (name.length > 30) {
    return "Họ tên không được vượt quá 30 ký tự";
  }
  return null;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Vui lòng nhập đúng định dạng email";
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự";
  }
  if (password.length > 30) {
    return "Mật khẩu không được vượt quá 30 ký tự";
  }
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt";
  }
  return null;
}

function validatePasswordConfirm(password, passwordConfirm) {
  if (password !== passwordConfirm) {
    return "Xác nhận mật khẩu không khớp";
  }
  return null;
}

function validateTerms(checked) {
  if (!checked) {
    return "Vui lòng chấp nhận điều khoản";
  }
  return null;
}

// Show error message
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = field.parentNode.querySelector(".error-message");
  if (errorDiv) {
    errorDiv.remove();
  }

  if (message) {
    const errorElement = document.createElement("div");
    errorElement.className = "error-message text-danger small mt-1";
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
    field.classList.add("is-invalid");
  } else {
    field.classList.remove("is-invalid");
  }
}

// Clear all errors
function clearErrors() {
  const errorMessages = document.querySelectorAll(".error-message");
  errorMessages.forEach((error) => error.remove());

  const invalidFields = document.querySelectorAll(".is-invalid");
  invalidFields.forEach((field) => field.classList.remove("is-invalid"));
}

// Form submission
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  clearErrors();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;
  const termsChecked = document.getElementById("customCheck").checked;

  let hasErrors = false;

  // Validate name
  const nameError = validateName(name);
  if (nameError) {
    showFieldError("name", nameError);
    hasErrors = true;
  }

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) {
    showFieldError("email", emailError);
    hasErrors = true;
  }

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) {
    showFieldError("password", passwordError);
    hasErrors = true;
  }

  // Validate password confirm
  const passwordConfirmError = validatePasswordConfirm(
    password,
    passwordConfirm
  );
  if (passwordConfirmError) {
    showFieldError("passwordConfirm", passwordConfirmError);
    hasErrors = true;
  }

  // Validate terms
  const termsError = validateTerms(termsChecked);
  if (termsError) {
    showFieldError("customCheck", termsError);
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  // Disable submit button
  signupBtn.disabled = true;
  signupBtn.textContent = "Đang xử lý...";

  try {
    const response = await fetch("/api/v1/users/signup-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
        role: "admin",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showAlert("success", "Đăng ký admin thành công!");
      // Reset form
      signupForm.reset();
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else {
      showAlert("error", data.message || "Có lỗi xảy ra khi đăng ký");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showAlert("error", "Có lỗi xảy ra khi đăng ký");
  } finally {
    // Re-enable submit button
    signupBtn.disabled = false;
    signupBtn.textContent = "Đăng ký Admin";
  }
});

// Real-time validation
document.getElementById("name").addEventListener("blur", function () {
  const error = validateName(this.value.trim());
  showFieldError("name", error);
});

document.getElementById("email").addEventListener("blur", function () {
  const error = validateEmail(this.value.trim());
  showFieldError("email", error);
});

document.getElementById("password").addEventListener("blur", function () {
  const error = validatePassword(this.value);
  showFieldError("password", error);
});

document
  .getElementById("passwordConfirm")
  .addEventListener("blur", function () {
    const password = document.getElementById("password").value;
    const error = validatePasswordConfirm(password, this.value);
    showFieldError("passwordConfirm", error);
  });

document.getElementById("customCheck").addEventListener("change", function () {
  const error = validateTerms(this.checked);
  showFieldError("customCheck", error);
});
