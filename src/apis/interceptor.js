import axios from 'axios';
import { showToast } from '@/utils/toast';

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} message
 * @property {*} data
 */

// Error codes mapping
const ERROR_MESSAGES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

// Get base URL from environment
const getBaseURL = () => {
  // Vite environment variable
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  // eslint-disable-next-line no-console
  console.log('base', baseUrl);

  if (baseUrl) {
    // Ensure protocol is included
    if (baseUrl.startsWith('//')) {
      return `${window.location.protocol}${baseUrl}`;
    }
    return baseUrl;
  }
  // Fallback to current origin
  return `${window.location.origin}/api/`;
};

// Create axios instance
const request = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
request.interceptors.request.use(
  (config) => {
    // Add auth token if exists
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config._requestTime = Date.now();

    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // Log request duration in development
    if (import.meta.env.DEV) {
      const requestTime = response.config._requestTime;
      if (requestTime) {
        console.debug(
          `[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${Date.now() - requestTime}ms`
        );
      }
    }

    // Check business logic success
    if (data && typeof data.success === 'boolean' && !data.success) {
      // Business error
      const errorMsg = data.message || 'Request failed';
      showToast(errorMsg, 'error');
      return Promise.reject(new Error(errorMsg));
    }

    return response;
  },
  (error) => {
    // Handle HTTP errors
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.message ||
      ERROR_MESSAGES[status] ||
      error.message ||
      'Network Error';

    console.error('[Response Error]', {
      status,
      message: errorMessage,
      url: error.config?.url,
    });

    // Show error toast
    showToast(errorMessage, 'error');

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - clear token and redirect to login if needed
      localStorage.removeItem('auth_token');
      // Emit event for handling in app
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

// Helper methods
export const http = {
  get(url, config) {
    return request.get(url, config);
  },

  post(url, data, config) {
    return request.post(url, data, config);
  },

  put(url, data, config) {
    return request.put(url, data, config);
  },

  delete(url, config) {
    return request.delete(url, config);
  },

  patch(url, data, config) {
    return request.patch(url, data, config);
  },
};

export default request;
