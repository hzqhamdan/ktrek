import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";
import Button from "../common/Button";
import { useToast } from "../ui/toast-1";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";

const RegisterForm = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    agree_terms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.errors[0];
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = "Full name must be at least 3 characters";
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirm password validation
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    // Date of birth validation
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = "Date of birth is required";
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.date_of_birth = "You must be at least 13 years old";
      }
    }

    // Terms agreement validation
    if (!formData.agree_terms) {
      newErrors.agree_terms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
      });

      if (response.success) {
        showToast("Registration successful! Please login.", "success");
        navigate("/login");
      } else {
        // Handle validation errors from backend
        if (response.errors) {
          setErrors(response.errors);
          const firstError = Object.values(response.errors)[0];
          showToast(firstError, "error");
        } else {
          showToast(response.message || "Registration failed", "error");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        const firstError = Object.values(error.response.data.errors)[0];
        showToast(firstError, "error");
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, "error");
      } else {
        showToast("Registration failed. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username Input */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.username ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="johndoe"
            autoComplete="username"
          />
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.email ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Full Name Input */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.full_name ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="John Doe"
            autoComplete="name"
          />
        </div>
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
        )}
      </div>

      {/* Date of Birth Input */}
      <div>
        <label
          htmlFor="date_of_birth"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date of Birth
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.date_of_birth ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          />
        </div>
        {errors.date_of_birth && (
          <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.password ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Must be 8+ characters with uppercase, lowercase, and numbers
        </p>
      </div>

      {/* Show Password Checkbox */}
      <label className="flex items-center">
        <input
          type="checkbox"
          id="show-password-register"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
          style={{ width: '1rem', height: '1rem' }}
        />
        <span className="ml-2 text-sm text-gray-600">Show Password</span>
      </label>

      {/* Confirm Password Input */}
      <div>
        <label
          htmlFor="confirm_password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${
              errors.confirm_password ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        {errors.confirm_password && (
          <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
        )}
      </div>

      {/* Show Confirm Password Checkbox */}
      <label className="flex items-center">
        <input
          type="checkbox"
          id="show-confirm-password-register"
          checked={showConfirmPassword}
          onChange={(e) => setShowConfirmPassword(e.target.checked)}
          className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
          style={{ width: '1rem', height: '1rem' }}
        />
        <span className="ml-2 text-sm text-gray-600">Show Password</span>
      </label>

      {/* Terms and Conditions */}
      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            name="agree_terms"
            checked={formData.agree_terms}
            onChange={handleChange}
            className="h-4 w-4 mt-1 text-[#120c07] border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{" "}
            <a
              href="#"
              className="text-[#120c07] hover:text-[#120c07] font-medium"
            >
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#120c07] hover:text-[#120c07] font-medium"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {errors.agree_terms && (
          <p className="mt-1 text-sm text-red-600">{errors.agree_terms}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;
