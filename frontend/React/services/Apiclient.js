import {BASE_URL} from '@env';

export const API_BASE_URL = BASE_URL || 'http://localhost:8080';

// Global reference to avoid circular dependency
let authContextRef = null;

// ─────────────────────────────────────────────────────────────────────────────
// ADDED: Refresh queue to prevent concurrent refresh token rotation.
//
// Problem: if 3 requests get a 401 simultaneously, each one calls
// refreshAccessToken() independently. With server-side refresh token rotation
// (the old token is revoked immediately on use), the 2nd and 3rd refresh calls
// use the already-revoked token, triggering the reuse-attack detection in
// RefreshTokenService and revoking ALL tokens for the user — logging them out.
//
// Solution: store the in-flight refresh Promise. Any concurrent 401 response
// awaits the SAME promise instead of starting a new refresh.
// ─────────────────────────────────────────────────────────────────────────────
let refreshPromise = null;

export const setAuthContextRef = auth => {
  authContextRef = auth;
};

const getStoredToken = () => {
  return authContextRef?.getToken?.() || null;
};

/**
 * Trigger a token refresh, or return the already-in-flight refresh promise.
 * This guarantees only one refresh call is made even if many requests 401 at once.
 */
const refreshOnce = async () => {
  if (refreshPromise) {
    // A refresh is already in flight — wait for it
    return refreshPromise;
  }

  // Start a new refresh and store the promise
  refreshPromise = authContextRef.refreshAccessToken().finally(() => {
    // Clear the promise reference once the refresh completes (success or fail)
    refreshPromise = null;
  });

  return refreshPromise;
};

export const apiFetch = async (
  path,
  options = {},
  overrideToken = null,
  isPublic = false,
  retryCount = 0,
) => {
  const MAX_RETRIES = 1;

  const token = isPublic ? null : overrideToken ?? getStoredToken();

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

  // Handle 401: attempt token refresh exactly once, using the shared queue
  if (response.status === 401 && !isPublic && retryCount < MAX_RETRIES) {
    console.log('[API] Token expired, attempting refresh...');

    if (authContextRef?.refreshAccessToken) {
      // CHANGED: use refreshOnce() instead of calling refreshAccessToken() directly.
      // Old code: const newToken = await authContextRef.refreshAccessToken();
      // Problem:  three simultaneous 401s each called refreshAccessToken() independently,
      //           causing the rotation logic to revoke the new refresh token on the
      //           2nd and 3rd call, logging the user out.
      const newToken = await refreshOnce();
      if (newToken) {
        return apiFetch(path, options, newToken, isPublic, retryCount + 1);
      }
    }

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
