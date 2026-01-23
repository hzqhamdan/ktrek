// src/components/auth/GoogleAuthButton.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";
import { useToast } from "../ui/toast-1";

const GoogleAuthButton = ({ text = "Sign in with Google", isLogin = true }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  // Get redirect path from location state (set when clicking attraction before login)
  const from = location.state?.from || '/dashboard';

  const handleSuccess = async (credentialResponse) => {
    console.log("Google credential received:", credentialResponse);
    try {
      // Send credential to backend
      const data = await authAPI.googleAuth(credentialResponse.credential);
      console.log("Backend response:", data); // DEBUG LOG
      if (data.success) {
        // Store auth data
        setAuth(data.data.user, data.data.token);
        showToast(
          `Welcome ${data.data.user.full_name || data.data.user.username}!`,
          "success"
        );
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          // Redirect to intended page or dashboard
          navigate(from, { replace: true });
        }, 100);
      } else {
        showToast(data.message || "Google authentication failed", "error");
      }
    } catch (error) {
      console.error("Google auth error:", error);
      showToast("Failed to authenticate with Google. Please try again.", "error");
    }
  };

  const handleError = () => {
    console.error("Google Sign-In failed");
    showToast("Google sign-in was cancelled or failed", "error");
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={isLogin ? "signin_with" : "signup_with"}
        theme="filled_black"
        size="large"
        width="400"
        logo_alignment="left"
        useOneTap={false}
      />
    </div>
  );
};

export default GoogleAuthButton;
