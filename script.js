/* ==========================================================================
   Student Registration Form - validation and interaction logic
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('registrationForm');
  var successMessage = document.getElementById('successMessage');

  /* ---------- Helper functions ---------- */

  // Show an error message on a single field
  function showError(fieldId, message) {
    var field = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + 'Error');

    // Add the class that styles the input border + shows the message
    field.closest('.field').classList.add('field--invalid');
    if (errorEl) errorEl.textContent = message;
  }

  // Remove the error state and message from a single field
  function clearError(fieldId) {
    var field = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + 'Error');

    field.closest('.field').classList.remove('field--invalid');
    if (errorEl) errorEl.textContent = '';
  }

  /* ---------- Individual field validators ----------
     Each returns true when the field is valid. */

  function validateFullName() {
    var value = document.getElementById('fullName').value.trim();

    if (value === '') {
      showError('fullName', 'Full name is required.');
      return false;
    }
    if (value.length < 3) {
      showError('fullName', 'Full name must be at least 3 characters.');
      return false;
    }
    clearError('fullName');
    return true;
  }

  function validateEmail() {
    var value = document.getElementById('email').value.trim();

    if (value === '') {
      showError('email', 'Email address is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showError('email', 'Please enter a valid email address (e.g. name@example.com).');
      return false;
    }
    clearError('email');
    return true;
  }

  function validatePhone() {
    // Accept digits, spaces, dashes, parentheses and an optional leading +
    var value = document.getElementById('phone').value.trim();
    var digitsOnly = value.replace(/[\s\-()]/g, '').replace(/^\+/, '');

    if (value === '') {
      showError('phone', 'Phone number is required.');
      return false;
    }
    if (!/^[\d\s\-()+]+$/.test(value)) {
      showError('phone', 'Phone number may only contain digits and separators (space, -, +, parentheses).');
      return false;
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      showError('phone', 'Phone number must have between 10 and 15 digits.');
      return false;
    }
    clearError('phone');
    return true;
  }

  function validateDob() {
    var value = document.getElementById('dob').value;

    if (value === '') {
      showError('dob', 'Date of birth is required.');
      return false;
    }

    var birthDate = new Date(value);
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    if (birthDate > today) {
      showError('dob', 'Date of birth cannot be in the future.');
      return false;
    }
    if (age < 10 || age > 100) {
      showError('dob', 'Student age should be between 10 and 100.');
      return false;
    }
    clearError('dob');
    return true;
  }

  function validateGender() {
    var selected = form.querySelector('input[name="gender"]:checked');

    if (!selected) {
      showError('gender', 'Please select a gender.');
      return false;
    }
    clearError('gender');
    return true;
  }

  function validateCourse() {
    if (document.getElementById('course').value === '') {
      showError('course', 'Please select a course.');
      return false;
    }
    clearError('course');
    return true;
  }

  function validateEducation() {
    if (document.getElementById('education').value === '') {
      showError('education', 'Please select your education level.');
      return false;
    }
    clearError('education');
    return true;
  }

  function validateAddress() {
    var value = document.getElementById('address').value.trim();

    if (value === '') {
      showError('address', 'Address is required.');
      return false;
    }
    if (value.length < 5) {
      showError('address', 'Please enter a complete address (at least 5 characters).');
      return false;
    }
    clearError('address');
    return true;
  }

  function validatePassword() {
    var value = document.getElementById('password').value;

    if (value === '') {
      showError('password', 'Password is required.');
      return false;
    }
    if (value.length < 8) {
      showError('password', 'Password must be at least 8 characters long.');
      return false;
    }
    clearError('password');
    return true;
  }

  function validateConfirmPassword() {
    var password = document.getElementById('password').value;
    var confirm = document.getElementById('confirmPassword').value;

    if (confirm === '') {
      showError('confirmPassword', 'Please confirm your password.');
      return false;
    }
    if (confirm !== password) {
      showError('confirmPassword', 'Passwords do not match.');
      return false;
    }
    clearError('confirmPassword');
    return true;
  }

  function validateTerms() {
    if (!document.getElementById('terms').checked) {
      showError('terms', 'You must accept the Terms & Conditions.');
      return false;
    }
    clearError('terms');
    return true;
  }

  // Full validator list, run in order using the input id as the key
  var validators = {
    fullName: validateFullName,
    email: validateEmail,
    phone: validatePhone,
    dob: validateDob,
    gender: validateGender,
    course: validateCourse,
    education: validateEducation,
    address: validateAddress,
    password: validatePassword,
    confirmPassword: validateConfirmPassword,
    terms: validateTerms
  };

  /* ---------- Form events ---------- */

  // Validate a field as soon as the user leaves it (blur)
  var validatedFields = ['fullName', 'email', 'phone', 'dob', 'course', 'education', 'address', 'password', 'confirmPassword'];

  validatedFields.forEach(function (id) {
    document.getElementById(id).addEventListener('blur', function () {
      validators[id]();
    });
  });

  // Trade a radio button for gender validation on change
  form.querySelectorAll('input[name="gender"]').forEach(function (radio) {
    radio.addEventListener('change', validateGender);
  });

  // Terms checkbox validates on change
  document.getElementById('terms').addEventListener('change', validateTerms);

  // Real-time password re-check while typing (only after the confirm field
  // is at least as long as the password, so shorter partial input is not
  // flagged as a mismatch)
  document.getElementById('confirmPassword').addEventListener('input', function () {
    var password = document.getElementById('password').value;
    var confirm = this.value;

    if (confirm === password) {
      clearError('confirmPassword');
    } else if (confirm && confirm.length >= password.length) {
      showError('confirmPassword', 'Passwords do not match.');
    } else {
      clearError('confirmPassword');
    }
  });

  // Validate everything when the user tries to submit
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // never send the data to a server

    // Run every validator so all problems are shown at once
    var allValid = true;
    Object.keys(validators).forEach(function (key) {
      if (!validators[key]()) allValid = false;
    });

    if (!allValid) {
      successMessage.hidden = true;

      // Focus the first invalid field for keyboard users
      var firstInvalid = form.querySelector('.field--invalid .field__input, .field--invalid input');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Everything passed: reset the form first, then show the success message
    // (never reveal the password in the message)
    form.reset();
    clearErrors();
    successMessage.hidden = false;
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Remove all error styling after a reset or successful submission
  function clearErrors() {
    form.querySelectorAll('.field--invalid').forEach(function (field) {
      field.classList.remove('field--invalid');
    });
    form.querySelectorAll('.field__error').forEach(function (errorEl) {
      errorEl.textContent = '';
    });
  }

  form.addEventListener('reset', function () {
    // Reset runs before this, so errors still reference old values - clear them now
    clearErrors();
    successMessage.hidden = true;
  });
})();