import api from "./index";

export const guidesAPI = {
  // Get guides for an attraction
  getByAttraction: async (attractionId) => {
    const response = await api.get(
      `/guides/get-by-attraction.php?attraction_id=${attractionId}`
    );
    return response.data;
  },

  // Get guides for a specific task
  getByTask: async (taskId) => {
    const response = await api.get(`/guides/get-by-task.php?task_id=${taskId}`);
    return response.data;
  },
};
