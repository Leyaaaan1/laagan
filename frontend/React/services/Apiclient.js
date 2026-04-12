import {BASE_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = BASE_URL || 'http://localhost:8080';

/**
 * CENTRALIZED API CLIENT
 *
 * - Automatically reads the token from AsyncStorage on every request.
 * - Never build Authorization headers manually in service files.
 * - For public endpoints (login, register) use the `public` helpers below.
 */

const getStoredToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch {
    return null;
  }
};

export const apiFetch = async (
  path,
  options = {},
  overrideToken = null,
  isPublic = false,
) => {
  // Use the override token if provided, otherwise read from AsyncStorage
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

  if (response.status === 401) throw new Error('AUTH_EXPIRED');
  if (response.status === 403) throw new Error('AUTH_FORBIDDEN');

  return response;
};

export const api = {
  // Authenticated requests — token is read from AsyncStorage automatically
  get: (path, token = null) => apiFetch(path, {method: 'GET'}, token),
  post: (path, body, token = null) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, token),
  put: (path, body, token = null) =>
    apiFetch(path, {method: 'PUT', body: JSON.stringify(body)}, token),
  delete: (path, token = null) => apiFetch(path, {method: 'DELETE'}, token),

  // Public requests — no token attached (login, register)
  publicPost: (path, body) =>
    apiFetch(path, {method: 'POST', body: JSON.stringify(body)}, null, true),
  publicGet: path => apiFetch(path, {method: 'GET'}, null, true),
};
