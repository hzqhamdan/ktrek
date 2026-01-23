import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { authAPI } from "../../api/auth";
import { useToast } from "../ui/toast-1";
import {
  validatePassword,
  validateUsername,
  normalizeAndValidateMalaysiaPhone,
} from "../../utils/validation";
const PhoneRegisterForm = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    phone: "",
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

  // Format: XXX-XXX-XXXX
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.errors[0];
    }

    // Phone validation
    const normalizedPhone = normalizeAndValidateMalaysiaPhone(formData.phone);
    if (!normalizedPhone) {
      newErrors.phone =
        "Invalid Malaysian phone number. Use format: 012-345-6789";
    }

    // Full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = "Full name must be at least 3 characters";
    }

    // Password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // Confirm password
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    // DOB
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

    // Terms
    if (!formData.agree_terms) {
      newErrors.agree_terms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Normalize phone number to +60 format
      const normalizedPhone = normalizeAndValidateMalaysiaPhone(formData.phone);
      console.log("Submitting registration:", {
        username: formData.username,
        email: normalizedPhone, // Backend expects phone in 'email' field
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
      });

      const response = await authAPI.register({
        username: formData.username,
        email: normalizedPhone, // Send normalized phone as 'email'
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
      {" "}
      {/* Username */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Username{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${errors.username ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="johndoe"
          />{" "}
        </div>{" "}
        {errors.username && (
          <p className="text-sm text-red-600 mt-1">{errors.username}</p>
        )}{" "}
      </div>{" "}
      {/* Phone */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Phone Number{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <span className="absolute left-10 top-2.5 text-gray-600 font-medium">
            +60
          </span>{" "}
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            className={`w-full pl-[4.5rem] pr-4 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="012-345-6789"
            maxLength="12"
          />{" "}
        </div>{" "}
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
        )}{" "}
        <p className="text-xs text-gray-500 mt-1">Format: 012-345-6789</p>{" "}
      </div>{" "}
      {/* Full Name */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Full Name{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${errors.full_name ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="John Doe"
          />{" "}
        </div>{" "}
        {errors.full_name && (
          <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
        )}{" "}
      </div>{" "}
      {/* DOB */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Date of Birth{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full pl-10 pr-4 py-2 border ${errors.date_of_birth ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
          />{" "}
        </div>{" "}
        {errors.date_of_birth && (
          <p className="text-sm text-red-600 mt-1">{errors.date_of_birth}</p>
        )}{" "}
      </div>{" "}
      {/* Password */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Password{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${errors.password ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="••••••••"
          />{" "}
        </div>{" "}
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password}</p>
        )}{" "}
      </div>{" "}
      {/* Show Password Checkbox */}{" "}
      <label className="flex items-center">
        <input
          type="checkbox"
          id="show-password-phone-register"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
          style={{ width: '1rem', height: '1rem' }}
        />
        <span className="ml-2 text-sm text-gray-600">Show Password</span>
      </label>{" "}
      {/* Confirm Password */}{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {" "}
          Confirm Password{" "}
        </label>{" "}
        <div className="relative">
          {" "}
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />{" "}
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-2 border ${errors.confirm_password ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="••••••••"
          />{" "}
        </div>{" "}
        {errors.confirm_password && (
          <p className="text-sm text-red-600 mt-1">{errors.confirm_password}</p>
        )}{" "}
      </div>{" "}
      {/* Show Confirm Password Checkbox */}{" "}
      <label className="flex items-center">
        <input
          type="checkbox"
          id="show-confirm-password-phone-register"
          checked={showConfirmPassword}
          onChange={(e) => setShowConfirmPassword(e.target.checked)}
          className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
          style={{ width: '1rem', height: '1rem' }}
        />
        <span className="ml-2 text-sm text-gray-600">Show Password</span>
      </label>{" "}
      {/* Terms */}{" "}
      <div className="flex items-start">
        {" "}
        <input
          type="checkbox"
          name="agree_terms"
          checked={formData.agree_terms}
          onChange={handleChange}
          className="h-4 w-4 mt-1 text-[#120c07] border-gray-300 rounded focus:ring-primary-500"
        />{" "}
        <label className="ml-2 text-sm text-gray-600">
          {" "}
          I agree to the{" "}
          <span className="text-[#120c07] hover:underline cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-[#120c07] hover:underline cursor-pointer">
            Privacy Policy
          </span>{" "}
        </label>{" "}
      </div>{" "}
      {errors.agree_terms && (
        <p className="text-sm text-red-600">{errors.agree_terms}</p>
      )}{" "}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors border-0 outline-none ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700 text-white"}`}
        style={{ border: 'none', outline: 'none' }}
      >
        {" "}
        {isLoading ? "Creating Account..." : "Create Account"}{" "}
      </button>{" "}
    </form>
  );
};
export default PhoneRegisterForm;
