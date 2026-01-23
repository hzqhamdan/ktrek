import api from "./index";

export const usersAPI = {
  updateProfile: async (payload) => {
    const response = await api.post("/users/update-profile.php", payload);
    return response.data;
  },
};
