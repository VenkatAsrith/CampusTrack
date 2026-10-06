import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'https://campustrack-g3n6.onrender.com';
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to absorb Render cold-starts
});

// Active delayed requests tracking
let activeDelayedTimers = new Map<any, any>();

// Interceptor to inject JWT token in Authorization header & track latency
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campustrack_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set a timer to trigger latency alert if request takes longer than 1100ms
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('campustrack:latency:start', {
          detail: {
            message: 'Communicating with institutional servers... Please wait a moment while changes are finalized.',
          },
        })
      );
    }, 1100);

    activeDelayedTimers.set(config, timer);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / errors and clear latency timer
api.interceptors.response.use(
  (response) => {
    const timer = activeDelayedTimers.get(response.config);
    if (timer) {
      clearTimeout(timer);
      activeDelayedTimers.delete(response.config);
    }
    window.dispatchEvent(new CustomEvent('campustrack:latency:end'));
    return response;
  },
  (error) => {
    if (error.config) {
      const timer = activeDelayedTimers.get(error.config);
      if (timer) {
        clearTimeout(timer);
        activeDelayedTimers.delete(error.config);
      }
    }
    window.dispatchEvent(new CustomEvent('campustrack:latency:end'));

    // Check for high latency / timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      window.dispatchEvent(
        new CustomEvent('campustrack:latency:timeout', {
          detail: {
            message: 'Server response delayed. Your local data has been preserved and auto-saved.',
          },
        })
      );
    }

    if (error.response && error.response.status === 401) {
      // Clear storage and redirect on unauthorized
      localStorage.removeItem('campustrack_token');
      localStorage.removeItem('campustrack_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signin') && !window.location.pathname.includes('/tpo')) {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
