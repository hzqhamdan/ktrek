// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { useToast } from "../components/ui/toast-1";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";
import { useAuthStore } from "../store/authStore";
import { authAPI } from "../api/auth";
import { CanvasRevealEffect } from "../components/ui/sign-in-flow-1";
import { cn } from "../lib/utils";

const RegisterPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      showToast("Passwords do not match", "error");
      return;
    }
    setIsLoading(true);
    try {
      const data = await authAPI.register({
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        date_of_birth: formData.date_of_birth,
      });
      
      if (data.success) {
        showToast("Account created! Please login.", "success");
        navigate("/login");
      } else {
        showToast(data.message || "Registration failed", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error registering", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn("flex w-[100%] flex-col min-h-screen bg-black relative")}
    >
      {/* Background: identical to SignInPage */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [255, 255, 255],
              [255, 255, 255],
            ]}
            dotSize={6}
            reverse={false}
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex flex-1 flex-col lg:flex-row ">
          <div className="flex-1 flex flex-col justify-center items-center">
            <motion.div
              className="w-full mt-[150px] max-w-sm"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Header: mirrored from SignInPage */}
              <div className="text-center mb-6">
                <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                  Create your account
                </h1>
                <p className="text-[1.25rem] text-white/50 font-light">
                  Join the journey
                </p>
              </div>
              {/* Google Sign Up */}
              <div className="mb-6 flex justify-center">
                <div className="w-full max-w-sm">
                  <GoogleAuthButton isLogin={false} />
                </div>
              </div>
              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-white/40 text-sm">or</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                      placeholder="Username"
                    />
                  </div>
                </div>
                {/* Full Name */}
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                      placeholder="Full name"
                    />
                  </div>
                </div>
                {/* Email */}
                <div>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Sign in link (placed directly under Email input) */}
                  <div className="mt-3 text-center">
                    <span className="text-sm text-white/60">
                      Already have an account?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-sm underline text-white/80 hover:text-white"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
                {/* Date of Birth */}
                <div>
                  <div className="relative">
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                    />
                  </div>
                </div>
                {/* Password */}
                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 pr-12 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-plain-btn absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-transparent hover:bg-white/10 transition flex items-center justify-center text-white/70 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 pr-12 focus:outline-none focus:border focus:border-white/30 bg-black/70"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="auth-plain-btn absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-transparent hover:bg-white/10 transition flex items-center justify-center text-white/70 hover:text-white"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full rounded-full font-medium py-3 transition-all duration-300 mt-6 border-0 outline-none ${
                    isLoading
                      ? "bg-[#111] text-white/50 cursor-not-allowed"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                  style={{ border: 'none', outline: 'none' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
