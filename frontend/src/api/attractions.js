import api from "./index";

const normalizeAttraction = (a) => {
  if (!a || typeof a !== "object") return a;
  return {
    ...a,
    id: a.id != null ? Number(a.id) : a.id,
    total_tasks: a.total_tasks != null ? Number(a.total_tasks) : a.total_tasks,
    completed_tasks:
      a.completed_tasks != null ? Number(a.completed_tasks) : a.completed_tasks,
    progress_percentage:
      a.progress_percentage != null ? Number(a.progress_percentage) : 0,
    reward_unlocked:
      a.reward_unlocked != null ? Number(a.reward_unlocked) : a.reward_unlocked,
  };
};

const normalizeAttractionsResponse = (payload) => {
  // Backend responses are typically { success, data, message }
  if (payload && payload.success && Array.isArray(payload.data)) {
    return { ...payload, data: payload.data.map(normalizeAttraction) };
  }
  // Sometimes callers pass through the array directly
  if (Array.isArray(payload)) {
    return payload.map(normalizeAttraction);
  }
  return payload;
};

export const attractionsAPI = {
  // Public homepage (no auth required)
  getPublic: async () => {
    const response = await api.get("/attractions/get-public.php");
    return normalizeAttractionsResponse(response.data);
  },

  // Get all attractions (authenticated)
  getAll: async () => {
    const response = await api.get("/attractions/get-all.php");
    return normalizeAttractionsResponse(response.data);
  },

  // Get single attraction by ID (authenticated)
  getById: async (id) => {
    const response = await api.get(`/attractions/get-by-id.php?id=${id}`);
    // get-by-id returns an object, normalize numeric fields
    const payload = response.data;
    if (payload && payload.success && payload.data) {
      return { ...payload, data: normalizeAttraction(payload.data) };
    }
    return payload;
  },

  // Get tasks for an attraction (authenticated)
  getTasks: async (attractionId) => {
    const response = await api.get(
      `/attractions/get-tasks.php?attraction_id=${attractionId}`
    );
    return response.data;
  },

  // Public - Get single attraction (no auth)
  getPublicById: async (id) => {
    const response = await api.get(
      `/attractions/get-public-by-id.php?id=${id}`
    );
    return response.data;
  },

  // Public - Get tasks for an attraction (no auth)
  getPublicTasks: async (attractionId) => {
    const response = await api.get(
      `/attractions/get-public-tasks.php?attraction_id=${attractionId}`
    );
    return response.data;
  },
};
