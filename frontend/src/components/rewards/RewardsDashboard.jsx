/**
 * Rewards Dashboard Component
 * Displays user's XP, level, badges, and progress
 */

import React, { useEffect } from 'react';
import useRewardStore from '../../store/rewardStore';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';

const RewardsDashboard = () => {
  const { stats, categoryProgress, fetchUserStats, loading } = useRewardStore();

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8 text-gray-500">
        No reward data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP and Level Card */}
      <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">Level {stats.current_level}</h2>
              <p className="text-purple-100">Explorer</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.total_xp} XP</div>
              <div className="text-sm text-purple-100">Total Experience</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {stats.current_level + 1}</span>
              <span>{stats.xp_to_next_level} XP needed</span>
            </div>
            <ProgressBar 
              current={stats.total_xp % 100} 
              total={100} 
              className="bg-purple-400"
              fillClassName="bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total_badges}</div>
          <div className="text-sm text-gray-600">Badges</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total_ep}</div>
          <div className="text-sm text-gray-600">Exploration Points</div>
        </Card>
        
      </div>

      {/* Category Progress */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Category Progress</h3>
          <div className="space-y-4">
            {categoryProgress.map((category) => (
              <CategoryProgressBar key={category.category} category={category} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

const CategoryProgressBar = ({ category }) => {
  const getCategoryName = (cat) => {
    const names = {
      malay_traditional: 'Malay Traditional',
      temples: 'Temples',
      beaches: 'Beaches',
    };
    return names[cat] || cat;
  };

  const getCategoryColor = (cat) => {
    const colors = {
      malay_traditional: 'from-red-500 to-amber-500',
      temples: 'from-purple-500 to-pink-500',
      beaches: 'from-blue-500 to-cyan-500',
    };
    return colors[cat] || 'from-gray-500 to-gray-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{getCategoryName(category.category)}</span>
          <div className="flex space-x-1">
            {category.bronze_unlocked && (
              <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded">🥉 Bronze</span>
            )}
            {category.silver_unlocked && (
              <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded">🥈 Silver</span>
            )}
            {category.gold_unlocked && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">🥇 Gold</span>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-600">
          {category.completed_attractions}/{category.total_attractions}
        </span>
      </div>
      
      <div className="relative">
        <ProgressBar 
          current={category.completion_percentage} 
          total={100}
          showPercentage={true}
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${getCategoryColor(category.category)} opacity-20 rounded-full`}></div>
      </div>
      
      {category.completion_percentage >= 100 && (
        <div className="mt-2 text-sm text-green-600 font-semibold">
          ✅ Category Completed!
        </div>
      )}
    </div>
  );
};

export default RewardsDashboard;
