import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthComponent } from '../ui/sign-up';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';
import { Gem } from 'lucide-react';
import { useToast } from "./toast-1";


// Custom logo component
const KTrekLogo = () => (
  <div className="bg-primary text-white rounded-md p-1.5">
    <Gem className="h-4 w-4" />
  </div>
);

export const ModernLoginComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToast();
  
  const from = location.state?.from || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.login({
        email: email,
        password: password,
      });
      
      if (response.success) {
        const { token, user } = response.data;
        setAuth(user, token);
        showToast('Login successful!', 'success');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 100);
      } else {
        showToast(response.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(241,238,231,0.95) 0%, #ffffff 55%, rgba(225,106,2,0.08) 100%)' }}>
      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-gray-700 hover:text-primary-600 transition-colors"
      >
        ← Back to Home
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-gray-600">Sign in to continue your K-Trek adventure</p>
      </div>

      {/* Note: The AuthComponent is designed for registration, so we'll need to create a custom login version */}
      <div className="text-center text-gray-600">
        <p className="mb-4">Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
