import api from "./index";

export const progressAPI = {
  // Get user's overall progress
  getUserProgress: async () => {
    const response = await api.get("/progress/get-user-progress.php");
    return response.data;
  },

  // Get progress for specific attraction
  getAttractionProgress: async (attractionId) => {
    const response = await api.get(
      `/progress/get-attraction-progress.php?attraction_id=${attractionId}`
    );
    return response.data;
  },
};
