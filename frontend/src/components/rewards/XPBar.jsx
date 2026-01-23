/**
 * XP Bar Component
 * Compact XP and level display for header/navigation
 */

import React, { useEffect } from 'react';
import useRewardStore from '../../store/rewardStore';
import { ProgressBar } from '../common/ProgressBar';

const XPBar = ({ compact = false }) => {
  const { stats, fetchUserStats } = useRewardStore();

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  if (!stats) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <span className="text-yellow-500">⭐</span>
          <span className="font-semibold">Lv.{stats.current_level}</span>
        </div>
        <div className="w-24">
          <ProgressBar
            current={stats.total_xp % 100}
            total={100}
            className="h-2"
            showPercentage={false}
          />
        </div>
        <span className="text-xs text-gray-500">{stats.total_xp} XP</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <div>
            <div className="font-bold text-lg">Level {stats.current_level}</div>
            <div className="text-xs text-gray-500">{stats.total_xp} XP</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Next Level</div>
          <div className="text-sm font-semibold text-primary">
            {stats.xp_to_next_level} XP
          </div>
        </div>
      </div>
      <ProgressBar
        current={stats.total_xp % 100}
        total={100}
        showPercentage={true}
      />
    </div>
  );
};

export default XPBar;
