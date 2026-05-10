import InAppBrowser from 'react-native-inappbrowser-reborn';
import {API_BASE_URL } from './Apiclient';
import {FACEBOOK_REDIRECT_URL} from '@env';


// ✅ Default import — NOT destructured. The old code used:
//    const {InAppBrowser} = await import('react-native-inappbrowser-reborn')
//    which destructures a *named* export that doesn't exist → null → crash.
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

export const loginWithFacebook = async () => {
  try {
    // 1. Open native Facebook login dialog (no browser, no HTTPS needed)
    const loginResult = await LoginManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);

    if (loginResult.isCancelled) {
      return {success: false, error: 'Facebook login cancelled'};
    }

    // 2. Get the Facebook access token from the SDK
    const tokenData = await AccessToken.getCurrentAccessToken();
    if (!tokenData?.accessToken) {
      return {success: false, error: 'Failed to get Facebook token'};
    }

    // 3. Send Facebook token to your Spring backend.
    //    Spring verifies it directly with Facebook Graph API
    //    and returns your own JWT tokens.
    const response = await fetch(`${API_BASE_URL}/riders/facebook-login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({accessToken: tokenData.accessToken}),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      console.error('❌ Facebook login backend error:', data);
      return {success: false, error: data?.message || 'Facebook login failed'};
    }

    return {
      success: true,
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        username: data.username,
      },
    };
  } catch (err) {
    console.error('❌ Facebook login error:', err);
    return {success: false, error: err.message || 'Facebook login failed'};
  }
};



export const loginUser    = authService.login;
export const registerUser = authService.register;