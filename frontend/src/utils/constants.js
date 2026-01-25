export const APP_NAME = "K-Trek";
export const APP_VERSION = "1.0.0";
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ATTRACTIONS: "/attractions",
  ATTRACTION_DETAIL: "/attractions/:id",
  TASK: "/tasks/:taskId",
  PROGRESS: "/progress",
  REWARDS: "/rewards",
  PROFILE: "/profile",
  REPORTS: "/reports",
};
export const TASK_TYPES = {
  QUIZ: "quiz",
  CHECKIN: "checkin",
};
export const API_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};
export const LOCAL_STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
};
// 5MB
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// 3 seconds
export const TOAST_DURATION = 3000;

export const BREAKPOINTS = {
  XS: 475,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

// Build full image URL from DB value
export const getImageUrl = (path) => {
  if (!path) return null;

  // If already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Get API base URL
  const apiBase = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost/backend/api';

  let normalizedPath = String(path).replace(/^\/+/, '');

  // In this project, attraction/admin images live under `admin/uploads/`.
  // The DB/API may return:
  // - uploads/file.jpg
  // - admin/uploads/file.jpg
  // - file.jpg
  // Normalize to admin/uploads/file.jpg when applicable.
  if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = `admin/${normalizedPath}`;
  } else if (!normalizedPath.includes('/')) {
    normalizedPath = `admin/uploads/${normalizedPath}`;
  }

  // Use image proxy endpoint to bypass ngrok interstitial warning
  // This allows images to be loaded with the ngrok-skip-browser-warning header
  return `${apiBase}/images/get.php?path=${encodeURIComponent(normalizedPath)}`;
};

// Simple placeholder image generator
export const getPlaceholderImage = (
  width = 400,
  height = 300,
  text = "No Image"
) => {
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
};
