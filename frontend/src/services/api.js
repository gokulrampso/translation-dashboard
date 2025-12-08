import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// Language API endpoints
export const languageApi = {
  // Get list of available languages
  getLanguages: async () => {
    const response = await api.get('/languages');
    return response.data;
  },

  // Get list of supported languages for translation
  getSupportedLanguages: async () => {
    const response = await api.get('/languages/supported');
    return response.data;
  },

  // Delete a language
  deleteLanguage: async (lang) => {
    const response = await api.delete(`/languages/${lang}`);
    return response.data;
  },
};

// Translation API endpoints
export const translationApi = {
  // Get translations for a language
  getTranslations: async (lang) => {
    const response = await api.get(`/translations/${lang}`);
    return response.data;
  },

  // Upload English translations (bulk import)
  uploadEnglish: async (translations, overwrite = false) => {
    const response = await api.post('/translations/upload', { translations, overwrite });
    return response.data;
  },

  // Download translations for a language
  downloadTranslations: async (lang) => {
    const response = await api.get(`/translations/${lang}/download`);
    return response.data;
  },

  // Update a single translation
  updateTranslation: async (lang, key, value) => {
    const response = await api.put(`/translations/${lang}/${encodeURIComponent(key)}`, { value });
    return response.data;
  },

  // Add a new key to all languages
  addKey: async (key, value) => {
    const response = await api.post('/translations/keys', { key, value });
    return response.data;
  },

  // Remove a key from all languages
  removeKey: async (key) => {
    const response = await api.delete(`/translations/keys/${encodeURIComponent(key)}`);
    return response.data;
  },

  // Re-translate a single key
  retranslateKey: async (lang, key) => {
    const response = await api.post(`/translations/${lang}/${encodeURIComponent(key)}/retranslate`);
    return response.data;
  },

  // Re-translate all keys for a language
  retranslateLanguage: async (lang) => {
    const response = await api.post(`/translations/${lang}/retranslate`);
    return response.data;
  },

  // Create a new language
  createLanguage: async (targetLang) => {
    const response = await api.post('/translations/new', { targetLang });
    return response.data;
  },

  // Update key order (for drag-and-drop reordering)
  updateKeyOrder: async (order) => {
    const response = await api.put('/translations/keys/order', { order });
    return response.data;
  },
};

// Cache API endpoints
export const cacheApi = {
  // Refresh cache from DynamoDB
  refreshCache: async () => {
    const response = await api.post('/cache/refresh');
    return response.data;
  },

  // Get cache status
  getCacheStatus: async () => {
    const response = await api.get('/cache/status');
    return response.data;
  },
};

// Usage/Cost API endpoints
export const usageApi = {
  // Get usage statistics
  getUsageStats: async () => {
    const response = await api.get('/usage');
    return response.data;
  },

  // Reset usage statistics
  resetUsageStats: async () => {
    const response = await api.post('/usage/reset');
    return response.data;
  },
};

export default api;

