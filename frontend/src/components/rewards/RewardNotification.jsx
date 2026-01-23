/**
 * Reward Notification Component
 * Shows animated notification when user earns rewards
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RewardNotification = ({ rewards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!rewards || rewards.length === 0) {
      setIsVisible(false);
      return;
    }

    // Auto-advance through rewards
    if (currentIndex < rewards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Close after showing last reward
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, rewards, onClose]);

  if (!rewards || rewards.length === 0 || !isVisible) {
    return null;
  }

  const reward = rewards[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                {getRewardIcon(reward.reward_type)}
              </div>
              <div>
                <p className="text-sm font-medium text-purple-100">
                  {getRewardTypeLabel(reward.reward_type)}
                </p>
                <h3 className="text-lg font-bold">{reward.reward_name}</h3>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
              className="text-white hover:text-purple-200"
            >
              ✕
            </button>
          </div>

          {reward.reward_description && (
            <p className="text-sm text-purple-100 mb-3">
              {reward.reward_description}
            </p>
          )}

          {/* Progress indicator */}
          {rewards.length > 1 && (
            <div className="flex space-x-1 mt-4">
              {rewards.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded ${
                    index === currentIndex
                      ? 'bg-white'
                      : index < currentIndex
                      ? 'bg-purple-300'
                      : 'bg-purple-400 bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const getRewardIcon = (type) => {
  const icons = {
    xp: '⭐',
    ep: '🎯',
    badge: '🏅',
    title: '👑',
    cosmetic: '✨',
    stamp: '✓',
    photo_card: '📸',
    fragment: '💎',
  };
  return <span className="text-2xl">{icons[type] || '🎁'}</span>;
};

const getRewardTypeLabel = (type) => {
  const labels = {
    xp: 'Experience Points',
    ep: 'Exploration Points',
    badge: 'Badge Earned',
    title: 'New Title',
    cosmetic: 'Cosmetic Unlocked',
    stamp: 'Stamp Collected',
    photo_card: 'Photo Card',
    fragment: 'Badge Fragment',
  };
  return labels[type] || 'Reward';
};

export default RewardNotification;
