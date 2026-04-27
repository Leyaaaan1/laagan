import {API_BASE_URL} from './Apiclient';

export const authService = {
  /**
   * Login user with username and password
   */
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error',
      };
    }
  },

  /**
   * Register new user
   */
  register: async (username, password, riderType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password, riderType}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Network error',
      };
    }
  },

  /**
   * Logout user
   */
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

// ✅ Export named functions for AuthScreen compatibility
export const loginUser = authService.login;
export const registerUser = authService.register;
