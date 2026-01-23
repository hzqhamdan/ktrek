import api from "./index";

export const rewardsAPI = {
  // Get user's unlocked rewards
  getUserRewards: async () => {
    const response = await api.get("/rewards/get-user-rewards.php");
    return response.data;
  },

  // Get user stats (XP, level, badges, etc.)
  getUserStats: async () => {
    const response = await api.get("/rewards/get-user-stats.php");
    return response.data;
  },

  // Get user badges
  getUserBadges: async () => {
    const response = await api.get("/rewards/get-badges.php");
    return response.data;
  },

  // Get user titles
  getUserTitles: async () => {
    const response = await api.get("/rewards/get-titles.php");
    return response.data;
  },

  // Set active title
  setActiveTitle: async (titleId) => {
    const response = await api.post("/rewards/set-active-title.php", {
      title_id: titleId,
    });
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (filter = "all", limit = 50) => {
    const response = await api.get("/rewards/get-leaderboard.php", {
      params: { filter, limit },
    });
    return response.data;
  },

  // Get category progress
  getCategoryProgress: async () => {
    const response = await api.get("/rewards/get-user-stats.php");
    return response.data?.data?.categories || [];
  },
};
