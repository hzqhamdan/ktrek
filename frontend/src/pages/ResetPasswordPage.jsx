import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, Mail } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { authAPI } from "../api/auth";
import Button from "../components/common/Button";
import { useToast } from "../components/ui/toast-1";

// Animated blob background (same as Login/Register)
const GradientBackground = () => (
  <>
    <style>
      {`@keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } } @keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } }`}
    </style>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="absolute top-0 left-0 w-full h-full"
    >
      <defs>
        <linearGradient id="rev_grad1_reset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--primary))", stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-3))", stopOpacity: 0.35 }} />
        </linearGradient>
        <linearGradient id="rev_grad2_reset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--chart-4))", stopOpacity: 0.45 }} />
          <stop offset="50%" style={{ stopColor: "rgb(var(--secondary))", stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-1))", stopOpacity: 0.4 }} />
        </linearGradient>
        <radialGradient id="rev_grad3_reset" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--destructive))", stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-5))", stopOpacity: 0.18 }} />
        </radialGradient>
        <filter id="rev_blur1_reset" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter id="rev_blur2_reset" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter id="rev_blur3_reset" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <g style={{ animation: "float1 20s ease-in-out infinite" }}>
        <ellipse
          cx="200"
          cy="500"
          rx="250"
          ry="180"
          fill="url(#rev_grad1_reset)"
          filter="url(#rev_blur1_reset)"
          transform="rotate(-30 200 500)"
        />
        <rect
          x="500"
          y="100"
          width="300"
          height="250"
          rx="80"
          fill="url(#rev_grad2_reset)"
          filter="url(#rev_blur2_reset)"
          transform="rotate(15 650 225)"
        />
      </g>
      <g style={{ animation: "float2 25s ease-in-out infinite" }}>
        <circle
          cx="650"
          cy="450"
          r="150"
          fill="url(#rev_grad3_reset)"
          filter="url(#rev_blur3_reset)"
          opacity="0.7"
        />
        <ellipse
          cx="50"
          cy="150"
          rx="180"
          ry="120"
          fill="rgb(var(--accent))"
          filter="url(#rev_blur2_reset)"
          opacity="0.35"
        />
      </g>
    </svg>
  </>
);

// BlurFade animation (same cadence as Register/Login)
function BlurFade({ children, className, delay = 0, duration = 0.4, yOffset = 6, blur = "6px" }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const ResetPasswordPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // request mode (no token) email
  const [requestEmail, setRequestEmail] = useState(location.state?.email || "");
  const [requestLoading, setRequestLoading] = useState(false);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Only validate token if we are in token-reset mode.
    if (token === null) return;
    if (!token) {
      showToast("Invalid reset link.", "error");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authAPI.verifyAndResetPassword(
        token,
        formData.newPassword
      );

      if (response.success) {
        setResetSuccess(true);
        showToast("Password reset successfully !", "success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        showToast(response.message || "Failed to reset password", "error");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.message || "Invalid or expired reset token";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // REQUEST MODE: no token -> send reset link
  if (!token) {
    const handleRequestReset = async (e) => {
      e.preventDefault();
      const emailToUse = (requestEmail || "").trim();

      if (!/\S+@\S+\.\S+/.test(emailToUse)) {
        showToast("Please enter a valid email address.", "error");
        return;
      }

      setRequestLoading(true);
      try {
        const response = await authAPI.resetPassword(emailToUse);
        if (response.success) {
          showToast(
            "If an account exists for this email, a reset link has been sent.",
            "success"
          );
        } else {
          showToast(response.message || "Failed to send reset link", "error");
        }
      } catch (error) {
        console.error("Reset password request error:", error);
        showToast(
          error.response?.data?.message || "Failed to send reset link",
          "error"
        );
      } finally {
        setRequestLoading(false);
      }
    };

    return (
      <div className="bg-background min-h-screen w-screen flex items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 z-0"><GradientBackground /></div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-card/70 backdrop-blur-md p-8">
          <BlurFade delay={0.25 * 1} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h2>
            <p className="text-gray-600 text-sm">Enter your email and we’ll send you a reset link</p>
          </BlurFade>

          <BlurFade delay={0.25 * 2}>
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex items-center rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-4 py-3 gap-3">
                <Mail className="h-5 w-5 text-foreground/70 shrink-0" />
                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  className="glass-auth-input flex-1 bg-transparent text-foreground placeholder:text-foreground/50 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={requestLoading}
              className="auth-plain-btn w-full rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-6 py-3.5 flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {requestLoading ? "Sending..." : "Send reset link"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="auth-plain-btn text-sm text-foreground/40 hover:text-foreground/80 transition-colors bg-transparent backdrop-blur-sm px-3 py-1 rounded-full"
              >
                Back to Login
              </button>
            </div>
          </form>
          </BlurFade>
        </motion.div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="bg-background min-h-screen w-screen flex items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 z-0"><GradientBackground /></div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-card/70 backdrop-blur-md p-8">
          <BlurFade delay={0.25 * 1} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
          </BlurFade>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen w-screen flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 z-0"><GradientBackground /></div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-card/70 backdrop-blur-md p-8">
        {/* Header */}
        <BlurFade delay={0.25 * 1} className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600 text-sm">
            Enter your new password below
          </p>
        </BlurFade>

        {/* Reset Password Form */}
        <BlurFade delay={0.25 * 2}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Input */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full pl-12 pr-12 py-3 border-2 ${
                  errors.newPassword ? "border-red-300" : "border-gray-200"
                } rounded-xl focus:border-primary-500 focus:outline-none transition-colors`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-plain-btn absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-transparent hover:bg-black/5 transition flex items-center justify-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-12 pr-12 py-3 border-2 ${
                  errors.confirmPassword ? "border-red-300" : "border-gray-200"
                } rounded-xl focus:border-primary-500 focus:outline-none transition-colors`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="auth-plain-btn absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-transparent hover:bg-black/5 transition flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="glass"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
            className="mt-6"
          >
            Reset Password
          </Button>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-[#120c07] hover:text-[#120c07] font-medium"
            >
              Back to Login
            </button>
          </div>
        </form>
        </BlurFade>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
