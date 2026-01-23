import React from 'react';
import { Trophy, Award, Medal } from 'lucide-react';

/**
 * CategoryProgressCard Component
 * Displays category completion progress with tier badges
 */
const CategoryProgressCard = ({ categoryData, categoryName }) => {
  if (!categoryData) return null;

  const {
    completion_percentage = 0,
    completed_attractions = 0,
    total_attractions = 0,
    bronze_unlocked = false,
    silver_unlocked = false,
    gold_unlocked = false,
    current_tier = 'none'
  } = categoryData;

  // Parse numeric values (backend may return strings)
  const completionPct = parseFloat(completion_percentage) || 0;
  const completedCount = parseInt(completed_attractions) || 0;
  const totalCount = parseInt(total_attractions) || 0;

  // Format category name for display
  const formatCategoryName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Tier badges configuration
  const tierBadges = [
    {
      name: 'Bronze',
      unlocked: bronze_unlocked,
      icon: Medal,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
      requirement: '33%'
    },
    {
      name: 'Silver',
      unlocked: silver_unlocked,
      icon: Award,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      requirement: '66%'
    },
    {
      name: 'Gold',
      unlocked: gold_unlocked,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      requirement: '100%'
    }
  ];

  // Calculate next tier
  const getNextTier = () => {
    if (!gold_unlocked) {
      if (!silver_unlocked) {
        if (!bronze_unlocked) {
          return { tier: 'Bronze', progress: completionPct, target: 33 };
        }
        return { tier: 'Silver', progress: completionPct, target: 66 };
      }
      return { tier: 'Gold', progress: completionPct, target: 100 };
    }
    return null;
  };

  const nextTier = getNextTier();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
          {formatCategoryName(categoryName)}
        </h3>
        <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full group-hover:bg-purple-100 transition-colors">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Progress</span>
          <span className="text-xs font-bold text-purple-600 group-hover:scale-110 transition-transform">
            {completionPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ease-out rounded-full relative"
            style={{ width: `${Math.min(completionPct, 100)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 2s infinite'
                 }} 
            />
          </div>
        </div>
        
        {nextTier && (
          <p className="text-xs text-gray-500 mt-1 group-hover:text-purple-600 transition-colors">
            {(nextTier.target - nextTier.progress).toFixed(0)}% to {nextTier.tier}
          </p>
        )}
      </div>

      {/* Tier Badges */}
      <div className="flex gap-2 justify-center">
        {tierBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.name}
              className={`
                flex flex-col items-center p-2 rounded-lg transition-all duration-300 cursor-pointer
                ${badge.unlocked 
                  ? `${badge.bgColor} scale-100 hover:scale-110 hover:rotate-3` 
                  : 'bg-gray-50 opacity-40 scale-95 hover:opacity-60 hover:scale-100'
                }
              `}
              title={`${badge.name} - ${badge.requirement}`}
            >
              <Icon 
                className={`
                  w-6 h-6 mb-1 transition-all duration-300
                  ${badge.unlocked ? `${badge.color} drop-shadow-md` : 'text-gray-400'}
                `}
                style={{
                  filter: badge.unlocked ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                }}
              />
              <span className={`
                text-xs font-semibold transition-colors
                ${badge.unlocked ? 'text-gray-700' : 'text-gray-400'}
              `}>
                {badge.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Gold Complete Badge */}
      {gold_unlocked && (
        <div className="mt-3 text-center animate-pulse">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-shadow">
            <Trophy className="w-3 h-3 animate-bounce" />
            Complete!
          </span>
        </div>
      )}
    </div>
  );
};

export default CategoryProgressCard;
