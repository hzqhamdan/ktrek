// src/components/auth/GoogleLoginButton.jsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../ui/toast-1";
const GoogleLoginButton = ({ isRegister = false }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const googleButtonRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (document.getElementById("google-identity-script")) {
        initializeGoogle();
        return;
      }
      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google || isInitialized.current) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (
        !clientId ||
        clientId ===
          "26046533380-hico249q0kl7opr0902nj2oqge2tn83n.apps.googleusercontent.com"
      ) {
        console.warn("Google Client ID not configured");
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: googleButtonRef.current.offsetWidth,
            text: isRegister ? "signup_with" : "signin_with",
            logo_alignment: "left",
          });
          isInitialized.current = true;
        }
      } catch (error) {
        console.error("Google Sign-In initialization error:", error);
      }
    };
    loadGoogleScript();
    return () => {
      // Cleanup on unmount
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [isRegister]);
  const handleGoogleResponse = async (response) => {
    try {
      const credential = response.credential;

      // Decode JWT token from Google
      const userObject = parseJwt(credential);
      if (!userObject) {
        showToast("Failed to parse Google response", "error");
        return;
      }

      // Send to your backend for verification
      // For now, we'll simulate successful auth
      const userData = {
        id: userObject.sub,
        username: userObject.email.split("@")[0],
        email: userObject.email,
        full_name: userObject.name,
        profile_picture: userObject.picture,
        auth_provider: "google",
      };

      // Generate a session token (in production, this comes from backend)
      const sessionToken =
        "google_session_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2);

      setAuth(userData, sessionToken);
      showToast(
        `${isRegister ? "Registration" : "Login"} successful with Google!`,
        "success"
      );

      // Navigate after a short delay
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error("Google auth error:", error);
      showToast("Google authentication failed. Please try again.", "error");
    }
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT:", error);
      return null;
    }
  };
  return (
    <div className="w-full">
      {" "}
      <div ref={googleButtonRef} className="w-full"></div>{" "}
      <noscript>
        {" "}
        <p className="text-sm text-gray-600 mt-2 text-center">
          {" "}
          Please enable JavaScript to use Google Sign-In{" "}
        </p>{" "}
      </noscript>{" "}
    </div>
  );
};
export default GoogleLoginButton;
