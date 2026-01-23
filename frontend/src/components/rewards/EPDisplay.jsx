import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

/**
 * EPDisplay Component
 * Displays Exploration Points (EP) with visual flair and animations
 */
const EPDisplay = ({ totalEP, epEarned = 0, size = 'medium', showLabel = true, animate = true }) => {
  const [displayEP, setDisplayEP] = useState(animate ? 0 : totalEP);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    small: {
      container: 'text-sm',
      icon: 'w-4 h-4',
      text: 'text-lg'
    },
    medium: {
      container: 'text-base',
      icon: 'w-5 h-5',
      text: 'text-2xl'
    },
    large: {
      container: 'text-lg',
      icon: 'w-6 h-6',
      text: 'text-3xl'
    }
  };

  const sizeClass = sizes[size] || sizes.medium;

  // Animated counter effect
  useEffect(() => {
    if (!animate) {
      setDisplayEP(totalEP);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = totalEP / steps;
    let currentStep = 0;

    setIsAnimating(true);
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayEP(totalEP);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayEP(Math.floor(increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalEP, animate]);

  return (
    <div className={`flex items-center gap-2 ${sizeClass.container} group`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
        
        <Sparkles 
          className={`${sizeClass.icon} text-purple-500 relative z-10 transition-all duration-300 ${
            isAnimating ? 'animate-pulse' : 'group-hover:scale-110 group-hover:rotate-12'
          }`} 
        />
        {epEarned > 0 && (
          <TrendingUp className="absolute -top-1 -right-1 w-3 h-3 text-green-500 animate-bounce z-20" />
        )}
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span 
            className={`font-semibold text-purple-600 ${sizeClass.text} transition-all duration-300 ${
              isAnimating ? 'scale-105' : 'group-hover:scale-105'
            }`}
            style={{
              textShadow: isAnimating ? '0 0 20px rgba(168, 85, 247, 0.4)' : 'none'
            }}
          >
            {displayEP.toLocaleString()}
          </span>
          {showLabel && (
            <span className="text-sm text-gray-600 group-hover:text-purple-600 transition-colors">
              EP
            </span>
          )}
        </div>
        
        {epEarned > 0 && (
          <span className="text-xs text-green-600 font-semibold animate-pulse flex items-center gap-1">
            <span className="inline-block animate-bounce">+{epEarned}</span>
            <span>EP</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default EPDisplay;
