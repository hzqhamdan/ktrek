import React, { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, Award, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { GlassButton } from '../ui/glass-button';
import confetti from 'canvas-confetti';

/**
 * RewardNotificationModal Component
 * Displays a modal when rewards are earned (XP, EP, badges, etc.)
 */
const RewardNotificationModal = ({ rewards, isOpen, onClose }) => {
  const currentUser = useAuthStore((state) => state.user);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min, max) => {
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

  if (!isOpen || !rewards) return null;

  const {
    xp_earned = 0,
    ep_earned = 0,
    new_rewards = [],
    user_stats = {},
    category_progress = null,
    attraction_complete = false
  } = rewards;

  const hasRewards = xp_earned > 0 || ep_earned > 0 || new_rewards.length > 0;

  console.log('[RewardModal] hasRewards check:', {
    xp_earned,
    ep_earned,
    new_rewards_length: new_rewards.length,
    hasRewards
  });

  if (!hasRewards) {
    console.log('[RewardModal] No rewards to show, returning null');
    return null;
  }

  console.log('[RewardModal] Rendering modal content!');

  // Determine reward icon based on type
  const getRewardIcon = (type) => {
    switch (type) {
      case 'badge': return Trophy;
      case 'stamp': return Award;
      case 'title': return Star;
      default: return Sparkles;
    }
  };

  // Calculate level progress percentage
  // Level system: 100 XP per level, Level = FLOOR(total_xp / 100) + 1
  const calculateLevelProgress = (stats) => {
    if (!stats || !stats.total_xp || !stats.current_level) return null;
    
    const xpForCurrentLevel = (stats.current_level - 1) * 100;
    const xpIntoCurrentLevel = stats.total_xp - xpForCurrentLevel;
    const xpNeededForLevel = 100; // 100 XP per level
    const progress = (xpIntoCurrentLevel / xpNeededForLevel) * 100;
    
    return {
      progress: Math.min(progress, 100),
      xp_for_next_level: stats.xp_to_next_level
    };
  };

  const levelProgress = calculateLevelProgress(user_stats);

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
            <div className="flex items-center gap-3 justify-center">
              {/* User Avatar Circle */}
              <div className="relative">
                <div className="relative w-14 h-14 rounded-full bg-white bg-opacity-90 border-2 border-purple-200 overflow-hidden flex items-center justify-center shadow-lg">
                  {currentUser?.profile_picture ? (
                    <img 
                      src={currentUser.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : currentUser?.avatar_style && currentUser?.avatar_seed ? (
                    <img 
                      src={`https://api.dicebear.com/7.x/${currentUser.avatar_style}/svg?seed=${currentUser.avatar_seed}`}
                      alt="Avatar" 
                      className="w-full h-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {currentUser?.username?.[0]?.toUpperCase() || currentUser?.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Rewards Earned!
            </h2>
            <p className="text-gray-600 text-lg font-semibold">
              Great job exploring!
            </p>
          </div>

          {/* Main Content */}
          <div className="w-full bg-white/70 rounded-xl p-4 space-y-4 backdrop-blur-sm">
            {/* XP and EP Display */}
            {(xp_earned > 0 || ep_earned > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {xp_earned > 0 && (
                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="text-blue-600 text-xs font-semibold mb-1">Experience</div>
                    <div className="text-blue-800 text-2xl font-bold flex items-center justify-center gap-1">
                      <Star className="w-4 h-4" />
                      +{xp_earned}
                    </div>
                  </div>
                )}
                
                {ep_earned > 0 && (
                  <div className="bg-purple-100 rounded-lg p-3">
                    <div className="text-purple-600 text-xs font-semibold mb-1">Exploration</div>
                    <div className="text-purple-800 text-2xl font-bold flex items-center justify-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      +{ep_earned}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New Rewards List */}
            {new_rewards.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2 text-left">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  New Items:
                </h3>
                {new_rewards.map((reward, index) => {
                  const Icon = getRewardIcon(reward.reward_type);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-3 border border-gray-200 text-left"
                    >
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-full">
                        <Icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">{reward.reward_name}</div>
                        {reward.reward_description && (
                          <div className="text-xs text-gray-500">{reward.reward_description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Attraction Complete */}
            {attraction_complete && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-4 text-center">
                <Trophy className="w-10 h-10 text-white mx-auto mb-2 animate-bounce" />
                <div className="text-white font-bold text-base">Attraction Complete!</div>
                <div className="text-yellow-100 text-sm">You've completed all tasks here</div>
              </div>
            )}

            {/* Progress Bar - Updated After Task Completion */}
            {levelProgress && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Level Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(levelProgress.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-purple-600">
                    {levelProgress.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-between">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Level {user_stats.current_level}
                  </span>
                  <span>
                    {levelProgress.xp_for_next_level ? `${levelProgress.xp_for_next_level} XP to next level` : 'Max level!'}
                  </span>
                </div>
              </div>
            )}

            {/* User Stats */}
            {user_stats && (
              <div className="flex items-center justify-center gap-4 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Total XP</div>
                  <div className="font-bold text-blue-600 text-sm">{user_stats.total_xp?.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Total EP</div>
                  <div className="font-bold text-purple-600 text-sm">{user_stats.total_ep?.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Level</div>
                  <div className="font-bold text-green-600 text-sm">{user_stats.current_level}</div>
                </div>
              </div>
            )}
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

export default RewardNotificationModal;
