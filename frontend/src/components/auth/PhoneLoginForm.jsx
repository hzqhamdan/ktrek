import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";
import Button from "../common/Button";
import { useToast } from "../ui/toast-1";
import { normalizeAndValidateMalaysiaPhone } from "../../utils/validation";
const PhoneLoginForm = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Get redirect path from location state (set when clicking attraction before login)
  const from = location.state?.from || '/dashboard';
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
    if (errors.phone) {
      setErrors((prev) => ({
        ...prev,
        phone: "",
      }));
    }
  };
  const handlePasswordChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      password: e.target.value,
    }));
    if (errors.password) {
      setErrors((prev) => ({
        ...prev,
        password: "",
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    const normalizedPhone = normalizeAndValidateMalaysiaPhone(formData.phone);
    if (!normalizedPhone) {
      newErrors.phone = "Invalid Malaysian phone number";
    } else {
      formData.phone = normalizedPhone;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await authAPI.login({
        email: formData.phone,
        password: formData.password,
      });
      console.log("Login response:", response);
      if (response.success) {
        const { token, user } = response.data;
        console.log("Phone login response data:", response.data);
        // Add is_first_login to user object
        const userWithLoginStatus = { ...user, is_first_login: response.data.is_first_login };
        setAuth(userWithLoginStatus, token);
        showToast("Login successful!", "success");
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          // Redirect to intended page or dashboard
          navigate(from, { replace: true });
        }, 100);
      } else {
        showToast(response.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "Invalid phone number or password. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      showToast("Please enter your email address.", "error");
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    
    setIsSendingReset(true);
    try {
      const response = await authAPI.resetPassword(forgotPasswordEmail);
      
      if (response.success) {
        setResetEmailSent(true);
        showToast("Password reset instructions sent to your email!", "success");
      } else {
        showToast(response.message || "Failed to send reset email", "error");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.response?.data?.message || "Failed to send reset email";
      showToast(errorMessage, "error");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Phone */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center gap-2 pl-4 pointer-events-none">
            <Phone className="text-gray-400 h-5 w-5" />
            <span className="text-gray-500">+6</span>
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            className={`input !pl-20 ${errors.phone ? "input-error" : ""}`}
            placeholder="012-345-6789"
            maxLength="12"
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600">{errors.phone}</p>
        )}
        </div>
      </div>
      {/* Password */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handlePasswordChange}
            className={`input !pl-12 ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
          />
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
        <label className="flex items-center">
          <input
            type="checkbox"
            id="show-password-phone-login"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded flex-shrink-0"
            style={{ width: '1rem', height: '1rem' }}
          />
          <span className="ml-2 text-sm text-gray-600">Show Password</span>
        </label>
        </div>
      </div>
      {/* Remember Me & Forgot Password */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="h-4 w-4 text-[#120c07] focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(true);
            setForgotPasswordEmail("");
          }}
          className="text-sm text-[#120c07] hover:text-[#120c07] font-medium"
        >
          Forgot password?
        </button>
        </div>
      </div>
      {/* Submit Button */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
      >
        Sign In with Phone
      </Button>
        </div>
      </div>
    </form>

    {/* Forgot Password Modal */}
    {showForgotPassword && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {!resetEmailSent ? (
            <>
              {/* Modal Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-[#120c07]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
                <p className="text-gray-600 text-sm">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail("");
                      setResetEmailSent(false);
                    }}
                    className="flex-1 px-4 py-3 border-0 bg-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 outline-none"
                    style={{ border: 'none', outline: 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed border-0 outline-none"
                    style={{ border: 'none', outline: 'none' }}
                  >
                    {isSendingReset ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email!</h3>
                <p className="text-gray-600 text-sm mb-6">
                  We've sent password reset instructions to<br />
                  <span className="font-semibold text-gray-900">{forgotPasswordEmail}</span>
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                    setResetEmailSent(false);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-lg transition-all font-medium border-0 outline-none"
                  style={{ border: 'none', outline: 'none' }}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};
export default PhoneLoginForm;
