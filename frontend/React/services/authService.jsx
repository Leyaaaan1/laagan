import {API_BASE_URL} from './Apiclient';

/**
 * Safely parse a response body as JSON.
 * Returns null instead of throwing if the body is empty or not JSON.
 */
const safeJson = async response => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export const authService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password}),
      });

      // Read body ONCE
      const data = await safeJson(response);

      if (!response.ok) {
        const message = data?.message || 'Login failed';
        console.error('❌ Login failed:', response.status, message);
        return {success: false, error: message};
      }

      return {
        success: true,
        data: {accessToken: data.accessToken, refreshToken: data.refreshToken},
      };
    } catch (err) {
      console.error('❌ Login network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },

  register: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password}),
      });

      // Read body ONCE — previous code called response.json() twice,
      // consuming the stream on the error path and breaking the success path.
      const data = await safeJson(response);

      if (!response.ok) {
        const message = data?.message || 'Registration failed';
        console.error('❌ Register failed:', response.status, message);
        return {success: false, error: message};
      }

      return {
        success: true,
        data: {accessToken: data.accessToken, refreshToken: data.refreshToken},
      };
    } catch (err) {
      console.error('❌ Register network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },

  logout: async token => {
    try {
      await fetch(`${API_BASE_URL}/riders/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return {success: true};
    } catch (err) {
      console.error('Logout error:', err);
      return {success: false, error: err.message};
    }
  },
};

export const loginUser = authService.login;
export const registerUser = authService.register;
