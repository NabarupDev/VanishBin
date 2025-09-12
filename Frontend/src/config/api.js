// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const API_ENDPOINTS = {
  upload: `${API_BASE_URL}/upload`,
  getContent: (id) => `${API_BASE_URL}/${id}`,
  getContentWithPassword: (id, password) => {
    const url = new URL(`${API_BASE_URL}/${id}`, window.location.origin);
    if (password) {
      url.searchParams.append('password', password);
    }
    return url.toString();
  },
  downloadFile: (id) => `${API_BASE_URL}/file/${id}`,
  getAllShares: `${API_BASE_URL}/all`,
  health: `${API_BASE_URL}/health`
};

export default API_BASE_URL;
