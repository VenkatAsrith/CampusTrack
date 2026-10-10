import axios, { type AxiosRequestConfig, AxiosError } from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'https://campustrack-g3n6.onrender.com';
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

// Specific Timeout Tiers (Section 13)
export const TIMEOUT_TIERS = {
  SEARCH: 8000,       // 8s for live query filters
  DEFAULT: 15000,     // 15s for general API reads
  DASHBOARD: 20000,   // 20s for aggregate analytics
  UPLOAD: 60000,      // 60s for file uploads
  EXPORT: 60000,      // 60s for Excel generation
};

// Retry Policy Constants (Section 14)
const MAX_AUTO_RETRIES = 2;
const SAFE_IDEMPOTENT_METHODS = ['get', 'head', 'options'];

interface CustomAxiosConfig extends AxiosRequestConfig {
  _retryCount?: number;
  _skipRetry?: boolean;
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: TIMEOUT_TIERS.DEFAULT,
});

// Active delayed requests tracking for UI latency alerts
const activeDelayedTimers = new Map<any, any>();

// Request interceptor: Inject JWT & assign tier timeouts
api.interceptors.request.use(
  (config: any) => {
    // 1. Inject Authentication Token
    const token = localStorage.getItem('campustrack_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Assign Timeout Tier by endpoint pattern
    const url = config.url || '';
    if (!config.timeout || config.timeout === TIMEOUT_TIERS.DEFAULT) {
      if (url.includes('/upload') || config.data instanceof FormData) {
        config.timeout = TIMEOUT_TIERS.UPLOAD;
      } else if (url.includes('/exports')) {
        config.timeout = TIMEOUT_TIERS.EXPORT;
      } else if (url.includes('/dashboard') || url.includes('/analytics')) {
        config.timeout = TIMEOUT_TIERS.DASHBOARD;
      } else if (config.params?.search) {
        config.timeout = TIMEOUT_TIERS.SEARCH;
      }
    }

    // 3. Set a timer to trigger subtle latency feedback if request takes > 1200ms
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('campustrack:latency:start', {
          detail: {
            message: 'Communicating with institutional servers... Please wait a moment while changes are finalized.',
          },
        })
      );
    }, 1200);

    activeDelayedTimers.set(config, timer);
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to calculate exponential backoff delay with random jitter (Section 5)
const getBackoffDelay = (retryIndex: number, retryAfter?: string | number): number => {
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (!isNaN(parsed) && parsed > 0) return Math.min(parsed * 1000, 30000);
  }
  // Exponential backoff: 600ms, 1200ms, 2400ms max with +/-20% jitter
  const baseDelay = Math.min(600 * Math.pow(2, retryIndex), 3000);
  const jitter = (Math.random() * 0.4 - 0.2) * baseDelay;
  return Math.max(300, Math.floor(baseDelay + jitter));
};

// Response interceptor: Intelligent retry policy, correlation ID, error translation
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
  async (error: AxiosError<any>) => {
    const config = error.config as CustomAxiosConfig | undefined;

    if (config) {
      const timer = activeDelayedTimers.get(config);
      if (timer) {
        clearTimeout(timer);
        activeDelayedTimers.delete(config);
      }
    }
    window.dispatchEvent(new CustomEvent('campustrack:latency:end'));

    const status = error.response?.status;
    const method = (config?.method || 'get').toLowerCase();
    const requestId =
      error.response?.headers?.['x-request-id'] ||
      error.response?.data?.requestId ||
      'CT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Intelligent Safe Retry Policy (Section 5 & 14)
    // Only automatically retry safe idempotent methods (GET, HEAD, OPTIONS) on transient network or 502/503/504 errors
    const isTransientError =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      status === 502 ||
      status === 503 ||
      status === 504;

    const isSafeMethod = SAFE_IDEMPOTENT_METHODS.includes(method);
    const canRetry = config && !config._skipRetry && isSafeMethod && isTransientError;

    if (canRetry) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < MAX_AUTO_RETRIES) {
        config._retryCount += 1;
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        const delay = getBackoffDelay(config._retryCount, retryAfterHeader);
        console.warn(
          `[CampusTrack Retry] Retrying ${method.toUpperCase()} ${config.url} (Attempt ${config._retryCount}/${MAX_AUTO_RETRIES}) after ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // 2. Network Disconnect / Offline Detection
    if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error' || (!error.response && error.code !== 'ECONNABORTED')) {
      window.dispatchEvent(
        new CustomEvent('campustrack:network-offline', {
          detail: {
            message: 'Network connection lost. Please check your internet connection.',
            requestId,
          },
        })
      );
    }

    // 3. Timeout Detection (Section 7, 13)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || status === 408 || status === 504) {
      window.dispatchEvent(
        new CustomEvent('campustrack:timeout', {
          detail: {
            message: 'The institutional server took longer than expected to respond. Your data is preserved.',
            requestId,
          },
        })
      );
    }

    // 3. Rate Limit Detection (Section 10)
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'] || error.response?.data?.error?.retryAfterSeconds || 60;
      window.dispatchEvent(
        new CustomEvent('campustrack:rate-limited', {
          detail: {
            message: error.response?.data?.error?.message || 'Too many requests. Please wait a moment before trying again.',
            retryAfterSeconds: Number(retryAfter) || 60,
            requestId,
          },
        })
      );
    }

    // 4. Session Expiration / Unauthorized (Section 17)
    if (status === 401) {
      localStorage.removeItem('campustrack_token');
      localStorage.removeItem('campustrack_user');
      window.dispatchEvent(
        new CustomEvent('campustrack:session-expired', {
          detail: {
            message: 'Your session has expired. Please sign in again to continue.',
            requestId,
          },
        })
      );
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signin') &&
        !window.location.pathname.includes('/tpo')
      ) {
        window.location.href = '/signin?session=expired';
      }
    }

    // 5. High-Traffic / 503 Overload Detection vs General Server Error (Section 2, 3)
    if (status === 503) {
      const retryAfter = error.response?.headers?.['retry-after'] || error.response?.data?.error?.retryAfterSeconds || 15;
      window.dispatchEvent(
        new CustomEvent('campustrack:high-traffic', {
          detail: {
            status: 503,
            requestId,
            retryAfterSeconds: Number(retryAfter) || 15,
            message: 'CampusTrack is experiencing high traffic right now. Please wait a moment and try again.',
          },
        })
      );
    } else if (status && status >= 500 && status !== 504) {
      window.dispatchEvent(
        new CustomEvent('campustrack:server-error', {
          detail: {
            status,
            requestId,
            message: error.response?.data?.error?.message || 'CampusTrack servers encountered a temporary issue.',
          },
        })
      );
    }

    // Attach standardized properties to the error object
    const enhancedError: any = error;
    enhancedError.requestId = requestId;
    enhancedError.code = error.response?.data?.error?.code || (status === 429 ? 'RATE_LIMITED' : 'NETWORK_ERROR');
    enhancedError.userMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      (status === 404 ? 'The requested resource was not found.' : 'Unable to complete request.');
    enhancedError.isWriteError = !isSafeMethod;
    if (!isSafeMethod) {
      enhancedError.safeRetryPrompt = 'Operation status is uncertain. Please verify your records before re-submitting to prevent duplicate entries.';
    }

    return Promise.reject(enhancedError);
  }
);

export default api;
