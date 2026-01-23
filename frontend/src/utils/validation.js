/** * Validate email format */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; /** * Validate password strength */
export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}; /** * Validate username */
export const validateUsername = (username) => {
  const errors = [];
  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }
  if (username.length > 20) {
    errors.push("Username must not exceed 20 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}; /** * Validate required field */
export const validateRequired = (value, fieldName = "This field") => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required`;
  }
  return null;
}; /** * Validate file type */
export const validateFileType = (file, allowedTypes) => {
  if (!file) return "No file selected";
  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
  }
  return null;
}; /** * Validate file size */
export const validateFileSize = (file, maxSize) => {
  if (!file) return "No file selected";
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return `File size exceeds ${maxSizeMB}MB`;
  }
  return null;
}; /** * Validate phone number (Malaysia format) */
export function normalizeAndValidateMalaysiaPhone(input) {
  if (!input) return null;

  // remove all non-digits
  let digits = input.replace(/\D/g, "");

  // remove leading + or 0 duplicates
  if (digits.startsWith("60")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);

  // after cleanup, Malaysian numbers should be 9–10 digits (1X-XXXXXXX/XXXXXXX)
  if (digits.length < 9 || digits.length > 10) return null;

  // must start with 1X (e.g., 10–19)
  if (!/^1[0-9]/.test(digits)) return null;

  return "+6" + digits; // backend format
}

/**
 * Validate date of birth (must be at least 13 years old)
 */
export const validateDateOfBirth = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  if (age < 13) {
    return "You must be at least 13 years old";
  }
  return null;
};
