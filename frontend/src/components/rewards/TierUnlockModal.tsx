import React, { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { AwardBadge } from '../ui/award-badge';
import { GlassButton } from '../ui/glass-button';
import confetti from 'canvas-confetti';

interface TierUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'bronze' | 'silver' | 'gold';
  category: string;
  epEarned: number;
  completionPercentage: number;
}

const TierUnlockModal: React.FC<TierUnlockModalProps> = ({
  isOpen,
  onClose,
  tier,
  category,
  epEarned,
  completionPercentage
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Show content with delay for animation
      setTimeout(() => setShowContent(true), 100);

      return () => {
        clearInterval(interval);
        setShowContent(false);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCategoryName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const tierMessages = {
    bronze: {
      title: 'Bronze Tier Unlocked!',
      message: 'You\'ve completed 33% of this category. Keep exploring!',
      emoji: '🥉'
    },
    silver: {
      title: 'Silver Tier Unlocked!',
      message: 'You\'ve completed 66% of this category. You\'re doing great!',
      emoji: '🥈'
    },
    gold: {
      title: 'Gold Tier Unlocked!',
      message: 'You\'ve mastered this category! Congratulations!',
      emoji: '🥇'
    }
  };

  const currentTier = tierMessages[tier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div 
        className={`relative bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 auth-plain-btn h-9 w-9 rounded-full bg-transparent hover:bg-black/5 transition flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sparkles Decoration */}
        <div className="absolute -top-2 -left-2">
          <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 -right-2">
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-6 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <div className="text-5xl animate-bounce">{currentTier.emoji}</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {currentTier.title}
            </h2>
            <p className="text-gray-600 text-lg font-semibold">
              {formatCategoryName(category)}
            </p>
          </div>

          {/* Award Badge */}
          <div className="flex justify-center py-4">
            <AwardBadge type={tier} category={category} />
          </div>

          {/* Stats */}
          <div className="w-full bg-white/70 rounded-xl p-4 space-y-3 backdrop-blur-sm">
            <p className="text-gray-700 text-sm">
              {currentTier.message}
            </p>
            
            {/* Category Progress Card */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Category Progress</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-purple-600">{completionPercentage.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {currentTier.title}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-purple-100 rounded-lg p-3">
                <div className="text-purple-600 text-xs font-semibold mb-1">EP Earned</div>
                <div className="text-purple-800 text-2xl font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  +{epEarned}
                </div>
              </div>
              
              <div className="bg-pink-100 rounded-lg p-3">
                <div className="text-pink-600 text-xs font-semibold mb-1">Total Progress</div>
                <div className="text-pink-800 text-2xl font-bold flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {completionPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <GlassButton
            onClick={onClose}
            className="w-full"
            size="lg"
          >
            Continue Exploring
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default TierUnlockModal;
