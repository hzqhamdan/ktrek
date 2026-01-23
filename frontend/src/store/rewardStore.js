/**
 * Reward Store
 * Manages reward system state using Zustand
 */

import { create } from 'zustand';
import { rewardsAPI } from '../api/rewards';

const useRewardStore = create((set, get) => ({
  // State
  stats: null,
  badges: [],
  cosmetics: [],
  titles: [],
  photoCards: [],
  categoryProgress: [],
  leaderboard: [],
  activeTitle: null,
  equippedCosmetics: {},
  loading: false,
  error: null,

  // Actions
  fetchUserStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rewardsAPI.getUserStats();
      if (response.success) {
        // Backend responses are wrapped as `{ success, data: { ... } }`.
        // Keep backward compatibility in case some endpoints return `{ success, data: ... }`.
        const payload = response.data?.data ?? response.data ?? {};

        set({
          stats: payload.stats || null,
          categoryProgress: payload.categories || [],
          loading: false,
        });
      } else {
        set({ error: response.message, loading: false });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBadges: async () => {
    try {
      const response = await rewardsAPI.getUserBadges();
      if (response.success) {
        set({ badges: response.data.badges || [] });
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    }
  },

  // fetchCosmetics removed (cosmetics feature deprecated)
  /* fetchCosmetics: async () => {
    try {
      const response = await rewardsAPI.getUserCosmetics();
      if (response.success) {
        const cosmetics = response.data.cosmetics || [];
        const equipped = {};
        
        cosmetics.forEach(cosmetic => {
          if (cosmetic.is_equipped) {
            equipped[cosmetic.cosmetic_type] = cosmetic;
          }
        });
        
        set({ 
          cosmetics: cosmetics,
          equippedCosmetics: equipped
        });
      }
    } catch (error) {
      console.error('Failed to fetch cosmetics:', error);
    }
  },*/

  fetchTitles: async () => {
    try {
      const response = await rewardsAPI.getUserTitles();
      if (response.success) {
        set({ 
          titles: response.data.titles || [],
          activeTitle: response.data.active_title
        });
      }
    } catch (error) {
      console.error('Failed to fetch titles:', error);
    }
  },

  // fetchPhotoCards removed (photo cards deprecated)
  /* fetchPhotoCards: async () => {
    try {
      const response = await rewardsAPI.getUserPhotoCards();
      if (response.success) {
        set({ photoCards: response.data.photo_cards || [] });
      }
    } catch (error) {
      console.error('Failed to fetch photo cards:', error);
    }
  },*/

  fetchLeaderboard: async (filter = 'all', limit = 50) => {
    try {
      const response = await rewardsAPI.getLeaderboard(filter, limit);
      if (response.success) {
        set({ leaderboard: response.data.leaderboard || [] });
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  },

  // equipCosmetic removed (cosmetics deprecated)
  /* equipCosmetic: async (cosmeticId, equip = true) => {
    try {
      const response = await rewardsAPI.equipCosmetic(cosmeticId, equip);
      if (response.success) {
        // Refresh cosmetics to get updated equipped state
        await get().fetchCosmetics();
      }
    } catch (error) {
      console.error('Failed to equip cosmetic:', error);
      throw error;
    }
  },*/

  setActiveTitle: async (titleId) => {
    try {
      const response = await rewardsAPI.setActiveTitle(titleId);
      if (response.success) {
        // Refresh titles to get updated active state
        await get().fetchTitles();
      }
    } catch (error) {
      console.error('Failed to set active title:', error);
      throw error;
    }
  },

  // Update stats after earning rewards (called from task completion)
  updateStatsFromTaskCompletion: (rewardData) => {
    if (!rewardData) return;

    const currentStats = get().stats;
    if (currentStats && rewardData.user_stats) {
      set({ stats: rewardData.user_stats });
    }

    // If new rewards earned, could trigger notification/animation
    if (rewardData.new_rewards && rewardData.new_rewards.length > 0) {
      console.log('New rewards earned:', rewardData.new_rewards);
      // Could dispatch an event or update a notification queue here
    }

    // If attraction completed, refresh category progress
    if (rewardData.attraction_complete) {
      get().fetchUserStats();
    }
  },

  // Initialize all reward data
  initializeRewards: async () => {
    await Promise.all([
      get().fetchUserStats(),
      get().fetchBadges(),
      get().fetchTitles(),
    ]);
  },

  // Reset store
  reset: () => {
    set({
      stats: null,
      badges: [],
      titles: [],
      categoryProgress: [],
      leaderboard: [],
      activeTitle: null,
      loading: false,
      error: null,
    });
  },
}));

export default useRewardStore;
