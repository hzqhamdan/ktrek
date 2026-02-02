import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost/backend/api",
  timeout: 30000, // Increased to 30 seconds for ngrok
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout on 401 if it's a session verification failure
    // Don't logout on authentication attempts (login, password change, etc.)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't auto-logout for auth endpoints
      const isAuthEndpoint = url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/change-password') ||
        url.includes('/auth/google-auth');

      if (!isAuthEndpoint) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
