import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false,
      setAuth: (user, token) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isGuest: false,
        });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: false,
        });
      },
      setGuest: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isGuest: true,
        }),
      setLoading: (isLoading) =>
        set({
          isLoading,
        }),
      updateUser: (userData) => {
        const updatedUser = {
          ...get().user,
          ...userData,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        set({
          user: updatedUser,
        });
      },
      getUser: () => get().user,
      getToken: () => get().token,
      isLoggedIn: () => get().isAuthenticated,
    }),
    {
      name: "auth-storage",
    }
  )
);
