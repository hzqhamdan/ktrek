import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ModernLogin } from '../components/ui/modern-login';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api/auth';
import { useToast } from "../components/ui/toast-1";
// No icon logo (text only) to match requested design
const KTrekLogo = () => null;

const ModernLoginPage = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const from = location.state?.from || '/dashboard';

  // Backend login handler
  const handleLogin = async (email, password) => {
    try {
      const response = await authAPI.login({
        email: email,
        password: password,
      });
      
      if (response.success) {
        const { token, user } = response.data;
        setAuth(user, token);
        showToast("Login successful!", "success");
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      } else {
        showToast(response.message || "Login failed", "error");
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        'Invalid email or password. Please try again.';
      showToast(errorMessage, "error");
      throw error;
    }
  };

  const handleForgotPassword = (email) => {
    // Navigate to the Reset Password page (request mode)
    navigate('/reset-password', { state: { email } });
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await authAPI.googleAuth(tokenResponse.access_token);

        if (response.success) {
          const { token, user } = response.data;
          setAuth(user, token);
          showToast("Google sign-in successful!", "success");

          const next = user?.avatar_seed
            ? from
            : `/onboarding/avatar?redirect=${encodeURIComponent(from)}`;
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

  return (
    <div className="relative">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 text-sm text-foreground/70 hover:text-foreground transition-colors"
      >
        ← Back to Home
      </Link>

      {/* Use the ModernLogin component with backend integration */}
      <ModernLogin 
        logo={<KTrekLogo />} 
        brandName="K-Trek"
        onLogin={handleLogin}
        onRequestPasswordReset={handleForgotPassword}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
};

export default ModernLoginPage;
