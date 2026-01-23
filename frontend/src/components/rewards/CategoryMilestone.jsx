import React from 'react';
import { Trophy } from 'lucide-react';
import { AwardBadge } from '../ui/award-badge';
import { AdminSidebarIcon } from '../ui/admin-sidebar-icon';

const CategoryMilestone = ({ categoryProgress }) => {
  if (!categoryProgress || categoryProgress.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          Category Milestones
        </h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Complete attractions to unlock category milestones!
        </p>
      </div>
    );
  }

  // Helper to get tier badge
  const getTierBadge = (category) => {
    if (category.gold_unlocked) {
      return {
        tier: 'Gold',
        emoji: '🥇',
        color: 'from-yellow-400 to-yellow-600',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200'
      };
    } else if (category.silver_unlocked) {
      return {
        tier: 'Silver',
        emoji: '🥈',
        color: 'from-gray-300 to-gray-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200'
      };
    } else if (category.bronze_unlocked) {
      return {
        tier: 'Bronze',
        emoji: '🥉',
        color: 'from-orange-400 to-orange-600',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      };
    }
    return null;
  };

  // Helper to format category name
  const formatCategoryName = (category) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter categories that have at least one tier unlocked
  const categoriesWithTiers = categoryProgress.filter(cat => 
    cat.bronze_unlocked || cat.silver_unlocked || cat.gold_unlocked
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <AdminSidebarIcon name="userProgress" className="w-6 h-6 text-[#120c07]" />
        Category Milestones
      </h3>
      
      {categoriesWithTiers.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          Complete attractions to unlock your first category milestone!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categoriesWithTiers.map((category) => {
            const tierBadge = getTierBadge(category);
            
            if (!tierBadge) return null;

            return (
              <div
                key={category.category}
                className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                {/* Award Badge Component */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <AwardBadge 
                    type={tierBadge.tier.toLowerCase()} 
                    category={category.category}
                  />
                </div>
                
                {/* Category Info Below Badge */}
                <div className="text-center space-y-3 w-full">
                  <h4 className="font-bold text-gray-800 text-base">
                    {formatCategoryName(category.category)}
                  </h4>
                  <div className={`${tierBadge.textColor} font-semibold text-sm`}>
                    {tierBadge.tier} Tier
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-600 px-2">
                    <span>{category.completed_attractions}/{category.total_attractions} attractions</span>
                    <span className="text-gray-500">{parseFloat(category.completion_percentage).toFixed(0)}% Complete</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryMilestone;
