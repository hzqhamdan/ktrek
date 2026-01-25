/**
 * Badge Collection Component
 * Displays all badges earned by the user
 */

import React, { useEffect } from 'react';
import useRewardStore from '../../store/rewardStore';
import { AwardBadge } from '../ui/award-badge';
import { Trophy } from 'lucide-react';

const BadgeCollection = () => {
  const { badges, fetchBadges, loading } = useRewardStore();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Debug logging
  console.log('BadgeCollection - badges:', badges);
  console.log('BadgeCollection - loading:', loading);
  console.log('BadgeCollection - badges length:', badges?.length);

  if (loading) {
    return <div className="text-center p-8">Loading badges...</div>;
  }

  if (!badges || badges.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="text-gray-600">No badges earned yet</p>
        <p className="text-sm text-gray-500 mt-2">Complete tasks to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-purple-600" />
        Your Badges & Achievements
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
};

const BadgeCard = ({ badge }) => {
  // Parse metadata to get rarity
  const metadata = badge.metadata ? (typeof badge.metadata === 'string' ? JSON.parse(badge.metadata) : badge.metadata) : {};
  const rarity = metadata.rarity || 'common';
  
  // Helper to format category name
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper to get rarity emoji
  const getRarityEmoji = (rarity) => {
    const emojis = {
      common: '⚪',
      rare: '🔵',
      epic: '🟣',
      legendary: '✨'
    };
    return emojis[rarity] || '🏅';
  };

  // Helper to get rarity color
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-600',
      rare: 'text-blue-600',
      epic: 'text-purple-600',
      legendary: 'text-yellow-600'
    };
    return colors[rarity] || 'text-gray-600';
  };

  return (
    <div className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
      {/* Award Badge Component */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AwardBadge 
          type={rarity.toLowerCase()} 
          category={badge.category}
        />
      </div>
      
      {/* Badge Info Below Badge */}
      <div className="text-center space-y-2 w-full">
        <h4 className="font-bold text-gray-800 text-base">
          {badge.reward_name}
        </h4>
        
        {badge.reward_description && (
          <p className="text-sm text-gray-600 px-2">
            {badge.reward_description}
          </p>
        )}
        
        <div className={`${getRarityColor(rarity)} font-semibold text-sm flex items-center justify-center gap-1`}>
          <span>{getRarityEmoji(rarity)}</span>
          <span>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</span>
        </div>
        
        <div className="text-xs text-gray-500 pt-2">
          Earned: {new Date(badge.earned_date).toLocaleDateString()}
        </div>
        
        {badge.category && (
          <div className="text-xs text-gray-400">
            {formatCategoryName(badge.category)}
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeCollection;
