import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import PhoneLoginForm from '../components/auth/PhoneLoginForm';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { motion } from 'framer-motion';
import { CanvasRevealEffect } from '../components/ui/sign-in-flow-1';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('email'); // email, phone, google

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Original Animated Dots Background */}
      <div className="absolute inset-0 z-0">
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-xl rounded-2xl shadow-2xl p-8"
          style={{ backgroundColor: '#F1EEE7' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="K-Trek" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600">
              Sign in to continue your K-Trek adventure
            </p>
          </div>

          {/* Google Sign-In */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-sm">
              <GoogleAuthButton isLogin={true} />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500" style={{ backgroundColor: '#F1EEE7' }}>or</span>
            </div>
          </div>

          {/* Email/Phone Tabs */}
          <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all border-0 outline-none ${
                activeTab === 'email'
                  ? 'text-[#120c07] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'email' ? { backgroundColor: '#F1EEE7', border: 'none', outline: 'none' } : { border: 'none', outline: 'none' }}
            >
               Email
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all border-0 outline-none ${
                activeTab === 'phone'
                  ? 'text-[#120c07] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'phone' ? { backgroundColor: '#F1EEE7', border: 'none', outline: 'none' } : { border: 'none', outline: 'none' }}
            >
               Phone
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'email' && (
              <div className="space-y-4">
                <LoginForm />
              </div>
            )}

            {activeTab === 'phone' && (
              <div className="space-y-4">
                <PhoneLoginForm />
              </div>
            )}
          </div>

        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-white/90 hover:text-white transition-colors drop-shadow-lg"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
