/**
 * Badge Collection Component
 * Displays all badges earned by the user
 */

import React, { useEffect } from 'react';
import useRewardStore from '../../store/rewardStore';
import { Card } from '../common/Card';

const BadgeCollection = () => {
  const { badges, fetchBadges, loading } = useRewardStore();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  if (loading) {
    return <div className="text-center p-8">Loading badges...</div>;
  }

  if (!badges || badges.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="text-gray-600">No badges earned yet</p>
        <p className="text-sm text-gray-500 mt-2">Complete attractions to earn badges!</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
};

const BadgeCard = ({ badge }) => {
  const getBadgeIcon = (identifier) => {
    const icons = {
      warisan_guardian_badge: '🏛️',
      spiritual_voyager_badge: '🕉️',
      coastal_conqueror_badge: '🏖️',
      cultural_explorer_badge: '🎭',
      kelantan_grand_master: '👑',
    };
    return icons[identifier] || '🏅';
  };

  const getBadgeGradient = (category) => {
    const gradients = {
      malay_traditional: 'from-red-500 to-amber-500',
      temples: 'from-purple-500 to-pink-500',
      beaches: 'from-blue-500 to-cyan-500',
      null: 'from-indigo-500 to-purple-600',
    };
    return gradients[category] || gradients[null];
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className={`bg-gradient-to-br ${getBadgeGradient(badge.category)} p-6 rounded-t-lg`}>
        <div className="text-6xl text-center mb-2">{getBadgeIcon(badge.reward_identifier)}</div>
        {badge.metadata?.tier === 'grand_master' && (
          <div className="absolute top-2 right-2 animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{badge.reward_name}</h3>
        {badge.reward_description && (
          <p className="text-sm text-gray-600 mb-2">{badge.reward_description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Earned: {new Date(badge.earned_date).toLocaleDateString()}
          </span>
          {badge.metadata?.tier && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {badge.metadata.tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BadgeCollection;
