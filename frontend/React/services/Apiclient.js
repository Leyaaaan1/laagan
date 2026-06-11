import {BASE_URL} from '@env';

export const API_BASE_URL = BASE_URL;

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST TIMEOUT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
const AUTH_TIMEOUT_MS = 15000; // 15 seconds for token refresh (slower endpoint)

// Global reference to avoid circular dependency
let authContextRef = null;

// Refresh queue to prevent concurrent token rotation
let refreshPromise = null;

export const setAuthContextRef = auth => {
  authContextRef = auth;
};

const getStoredToken = () => {
  return authContextRef?.getToken?.() || null;
};

/** * Fetch with timeout using Promise.race *
 * @param {string} url - The URL to fetch * @param {Object} options - Fetch options * @param {number} timeout - Timeout in milliseconds (default: 10000) * @returns {Promise<Response>} The fetch response or timeout error */
const fetchWithTimeout = (url, options = {}, timeout = DEFAULT_TIMEOUT_MS) => {
  // If no timeout specified, just use regular fetch
  if (!timeout) {
    return fetch(url, options);
  }

  // Create timeout promise that rejects after timeout period
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      const timeoutError = new Error(
        `Request timeout after ${timeout}ms: ${options.method || 'GET'} ${url}`,
      );
      timeoutError.code = 'ETIMEDOUT';
      timeoutError.timeout = timeout;
      reject(timeoutError);
    }, timeout),
  );

  // Race between actual fetch and timeout
  // Whichever completes first wins
  return Promise.race([fetch(url, options), timeoutPromise]);
};



/** * Trigger a token refresh, or return the already-in-flight refresh promise. * This guarantees only one refresh call is made even if many requests 401 at once. */
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

/** * Main API fetch function with timeout, error handling, and token refresh logic *
 * @param {string} path - API endpoint path * @param {Object} options - Fetch options * @param {string} overrideToken - Override token (for multi-part requests) * @param {boolean} isPublic - Whether this is a public endpoint * @param {number} retryCount - Internal retry counter * @returns {Promise<Response>} The fetch response */
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

  try {
    // Determine timeout based on endpoint type
    // Ride creation can take a long time, so no timeout
    const isTokenRefresh = path.includes('/refresh');
    const isRideCreation = path.includes('/riders/create');
    const isRidesList = path.includes('/riders/rides') || path.includes('/rides');

    let timeout = DEFAULT_TIMEOUT_MS;
    if (isRideCreation) {
      timeout = null;
    } else if (isTokenRefresh) {
      timeout = AUTH_TIMEOUT_MS;
    } else if (isRidesList) {
      timeout = 30000; // 30s to allow cold start
    }

    // Make fetch call WITH timeout (or without if timeout is null)
    const response = await fetchWithTimeout(
      `${API_BASE_URL}${path}`,
      {
        ...options,
        headers,
      },
      timeout,
    );

    // Handle 401: attempt token refresh exactly once, using the shared queue
    if (response.status === 401 && !isPublic && retryCount < MAX_RETRIES) {
      console.log('[API] Token expired, attempting refresh...');

      if (authContextRef?.refreshAccessToken) {
        const newToken = await refreshOnce();
        if (newToken) {
          return apiFetch(path, options, newToken, isPublic, retryCount + 1);
        }
      }

      throw new Error('AUTH_EXPIRED');
    }

    if (response.status === 401) throw new Error('AUTH_EXPIRED');
    if (response.status === 403) throw new Error('AUTH_FORBIDDEN');
    if (response.status === 429) throw new Error('RATE_LIMITED');


    return response;
  } catch (error) {
    // Handle timeout errors specifically
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {

      const timeoutError = new Error('REQUEST_TIMEOUT');
      timeoutError.originalError = error;
      throw timeoutError;
    }

    // Handle network errors
    if (
      error.message === 'Network request failed' ||
      error.message.includes('Network')
    ) {

      const networkError = new Error('NETWORK_ERROR');
      networkError.originalError = error;
      throw networkError;
    }

    // Re-throw auth and other errors as-is
    throw error;
  }
};

/** * HTTP client with methods for all REST operations * All requests automatically include timeout and error handling */
export const api = {
  /**   * GET request   * @param {string} path - API endpoint   * @param {string} token - Optional override token   */
  get: (path, token = null) => apiFetch(path, {method: 'GET'}, token),

  /**   * POST request with JSON body   * @param {string} path - API endpoint   * @param {Object} body - Request body   * @param {string} token - Optional override token   */
  post: (path, body, token = null) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, token),

  /**   * PUT request with JSON body   * @param {string} path - API endpoint   * @param {Object} body - Request body   * @param {string} token - Optional override token   */
  put: (path, body, token = null) =>
    apiFetch(path, {method: 'PUT', body: JSON.stringify(body)}, token),

  /**   * DELETE request   * @param {string} path - API endpoint   * @param {string} token - Optional override token   */
  delete: (path, token = null) => apiFetch(path, {method: 'DELETE'}, token),

  /**   * Public POST request (no auth required)   * @param {string} path - API endpoint   * @param {Object} body - Request body   */
  publicPost: (path, body) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, null, true),

  /**   * Public GET request (no auth required)   * @param {string} path - API endpoint   */
  publicGet: path => apiFetch(path, {method: 'GET'}, null, true),

  patch: (path, body = null, token = null) =>
    apiFetch(
      path,
      {method: 'PATCH', body: body ? JSON.stringify(body) : undefined},
      token,
    ),
};
