import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://untense-gustier-yolande.ngrok-free.dev/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth-token");
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("user-data");

      // Redirect to login if not already there
      if (window.location.pathname !== "/auth/signin") {
        window.location.href = "/auth/signin";
      }
    }

    // Return standardized error format
    const errorResponse = {
      success: false,
      message:
        error.response?.data?.message || error.message || "An error occurred",
      code: error.response?.data?.code || "UNKNOWN_ERROR",
      details: error.response?.data?.details || null,
      retryAfter: error.response?.data?.retryAfter || null,
    };

    return Promise.reject(errorResponse);
  }
);

export default api;

export const locationService = {
  getGeoJSON: async (category, filename) => {
    const safeCategory = encodeURIComponent(category);
    const safeFilename = encodeURIComponent(filename);
    return await api.get(`/locations/map/${safeCategory}/${safeFilename}`);
  },
  getSearchIndex: async () => {
    const endpoints = [
      "/locations/search-index",
      "/locations/search_index.json",
      "/locations/search-index.json",
    ];
    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        return await api.get(endpoint);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },
};
