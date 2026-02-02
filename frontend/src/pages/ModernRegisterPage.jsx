import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthComponent } from '../components/ui/sign-up';
import { authAPI } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useToast } from "../components/ui/toast-1";
import { useGoogleLogin } from '@react-oauth/google';

// No icon logo (text only) to match requested design
const KTrekLogo = () => null;

const ModernRegisterPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Google OAuth handler
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await authAPI.googleAuth(tokenResponse.access_token);
        
        if (response.success) {
          const { token, user } = response.data;
          setAuth(user, token);
          showToast("Google sign-in successful!", "success");

          const next = user?.avatar_seed ? "/dashboard" : "/onboarding/avatar";
          setTimeout(() => {
            navigate(next, { replace: true });
          }, 100);
        } else {
          showToast(response.message || "Google sign-in failed", "error");
        }
      } catch (error) {
        console.error('Google sign-in error:', error);
        showToast(
          error.response?.data?.message || "Google sign-in failed",
          "error"
        );
      }
    },
    onError: () => {
      showToast("Google sign-in was cancelled or failed.", "error");
    },
  });

  // Backend registration handler
  const handleRegister = async (email, password) => {
    try {
      const response = await authAPI.register({
        username: email.split('@')[0], // Generate username from email
        email: email,
        full_name: email.split('@')[0], // Default to email prefix
        password: password,
        date_of_birth: '2000-01-01', // Default date - user can update in profile
      });

      if (response.success) {
        // Auto-login after successful registration so we can send the user to avatar onboarding
        const loginRes = await authAPI.login({ email, password });
        if (loginRes.success) {
          const { token, user } = loginRes.data;
          setAuth(user, token);
          showToast("Registration successful!", "success");
          setTimeout(() => {
            navigate('/onboarding/avatar', { replace: true });
          }, 600);
          return { success: true };
        }

        showToast("Registration successful! Please login.", "success");
        setTimeout(() => {
          navigate('/login');
        }, 5000);
        return { success: true };
      } else {
        // Handle validation errors from backend
        const errorMsg = response.errors 
          ? Object.values(response.errors)[0] 
          : response.message || 'Registration failed';
        showToast(errorMsg, "error");
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error.response?.data?.errors 
        ? Object.values(error.response.data.errors)[0]
        : error.response?.data?.message || 'Registration failed. Please try again.';
      showToast(errorMsg, "error");
      return { success: false, message: errorMsg };
    }
  };

  return (
    <div className="relative">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-sm text-foreground/70 hover:text-foreground transition-colors"
      >
        ← Back to Home
      </Link>

      {/* Use the AuthComponent with backend integration */}
      <AuthComponent 
        logo={<KTrekLogo />} 
        brandName="K-Trek"
        onCheckIdentifier={async (emailOrPhone) => {
          const res = await authAPI.checkIdentifier(emailOrPhone);
          if (res.success) return { success: true };
          const msg = res.errors ? Object.values(res.errors)[0] : res.message || "Not available";
          return { success: false, message: msg };
        }}
        onRegister={handleRegister}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
};

export default ModernRegisterPage;
