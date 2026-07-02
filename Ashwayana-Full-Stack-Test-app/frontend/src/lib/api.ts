import axios from 'axios';

// ============================================================================
// PRODUCTION API CLIENT
// All requests go to the real backend. No mock fallbacks.
// ============================================================================

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR – attach JWT token if present
// ============================================================================

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ============================================================================
// BACKEND CONNECTIVITY NOTIFICATION
// Dispatches a custom DOM event so the UI banner can show online/offline state
// ============================================================================

const notifyBackendStatus = (online: boolean) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('backend-status-change', { detail: { online } })
    );
  }
};

// ============================================================================
// RESPONSE INTERCEPTOR – propagate real errors, no mock substitution
// ============================================================================

api.interceptors.response.use(
  (response) => {
    notifyBackendStatus(true);
    return response;
  },
  (error) => {
    if (!error.response) {
      // Network error – backend unreachable
      notifyBackendStatus(false);
      error.response = {
        status: 503,
        statusText: 'Service Unavailable',
        data: {
          success: false,
          message:
            'Cannot reach the backend server at 192.168.68.116:8081/api. Please verify the server is running and the network is reachable.',
        },
        headers: {},
        config: error.config || {},
      };
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);
