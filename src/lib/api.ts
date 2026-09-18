import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('admin-auth');
    if (storage) {
      try {
        const { state } = JSON.parse(storage);
        if (state?.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
      } catch {}
    }
  }
  return config;
});

export default api;
