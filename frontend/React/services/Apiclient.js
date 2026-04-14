import {BASE_URL} from '@env';
import {useAuth} from '../context/AuthContext';

export const API_BASE_URL = BASE_URL || 'http://localhost:8080';

// Global reference to avoid circular dependency
let authContextRef = null;

export const setAuthContextRef = auth => {
  authContextRef = auth;
};

const getStoredToken = async () => {
  return authContextRef?.getToken?.() || null;
};

export const apiFetch = async (
  path,
  options = {},
  overrideToken = null,
  isPublic = false,
  retryCount = 0,
) => {
  const MAX_RETRIES = 1;

  // Use override token if provided, otherwise get from context
  const token = isPublic ? null : overrideToken ?? (await getStoredToken());

  if (!isPublic && !token) {
    throw new Error('AUTH_MISSING');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // ✅ Handle 401: Attempt token refresh
  if (response.status === 401 && !isPublic && retryCount < MAX_RETRIES) {
    console.log('[API] Token expired, attempting refresh...');

    if (authContextRef?.refreshAccessToken) {
      const newToken = await authContextRef.refreshAccessToken();
      if (newToken) {
        // Retry the request with new token
        return apiFetch(path, options, newToken, isPublic, retryCount + 1);
      }
    }

    // Refresh failed — user is logged out
    throw new Error('AUTH_EXPIRED');
  }

  if (response.status === 401) throw new Error('AUTH_EXPIRED');
  if (response.status === 403) throw new Error('AUTH_FORBIDDEN');

  return response;
};

export const api = {
  get: (path, token = null) => apiFetch(path, {method: 'GET'}, token),
  post: (path, body, token = null) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, token),
  put: (path, body, token = null) =>
    apiFetch(path, {method: 'PUT', body: JSON.stringify(body)}, token),
  delete: (path, token = null) => apiFetch(path, {method: 'DELETE'}, token),
  publicPost: (path, body) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, null, true),
  publicGet: path => apiFetch(path, {method: 'GET'}, null, true),
};
