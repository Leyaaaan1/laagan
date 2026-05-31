import {API_BASE_URL} from './Apiclient';
import {AccessToken, LoginManager} from 'react-native-fbsdk-next';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

const safeJson = async response => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const message = data?.message || 'Login failed';
        console.error('❌ Login failed:', response.status, message);
        return {success: false, error: message};
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
      console.error('❌ Login network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },

  // FIX: Backend returns {null, null, null} on successful registration —
  // it just triggers Supabase email and waits. We must signal pendingVerification
  // so AuthScreen shows PendingVerificationScreen instead of trying to log in.
  register: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const message = data?.message || 'Registration failed';
        console.error('❌ Register failed:', response.status, message);
        return {success: false, error: message};
      }
      // Backend returns nulls — registration started, email verification pending
      return {
        success: true,
        pendingVerification: true, // ← always true for email/password register
      };
    } catch (err) {
      console.error('❌ Register network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },



    verifyEmail: async (accessToken, tokenHash, type = 'signup') => {
      try {
        let url;

        if (tokenHash) {
          // PKCE flow — newer Supabase (no toggle available)
          console.log('🔍 [verifyEmail] Using token_hash flow');
          url = `${API_BASE_URL}/riders/verify-email?token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
        } else if (accessToken) {
          // Implicit flow — older Supabase or PKCE disabled
          console.log('🔍 [verifyEmail] Using access_token flow');
          url = `${API_BASE_URL}/riders/verify-email?accessToken=${encodeURIComponent(accessToken)}`;
        } else {
          return {success: false, error: 'No verification token provided'};
        }

        console.log('🔍 [verifyEmail] Calling:', url.substring(0, 80) + '...');

        const response = await fetch(url, {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        });

        const data = await safeJson(response);
        console.log('🔍 [verifyEmail] Response status:', response.status);
        console.log('🔍 [verifyEmail] Response body:', JSON.stringify(data));

        if (!response.ok) {
          return {success: false, error: data?.message || `HTTP ${response.status}`};
        }

        const accessTokenValue = data?.accessToken || data?.access_token;
        const refreshTokenValue = data?.refreshToken || data?.refresh_token;
        const usernameValue = data?.username;

        if (!accessTokenValue || !refreshTokenValue) {
          return {success: false, error: 'Server returned incomplete response'};
        }

        return {
          success: true,
          data: {
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
            username: usernameValue,
          },
        };
      } catch (err) {
        console.error('❌ [verifyEmail] Network error:', err.message);
        return {success: false, error: err.message || 'Network error'};
      }
    },

  deleteAccount: async token => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const message = data?.message || 'Failed to delete account';
        console.error('❌ Delete account failed:', response.status, message);
        return {success: false, error: message};
      }
      return {success: true};
    } catch (err) {
      console.error('❌ Delete account network error:', err);
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
    const loginResult = await LoginManager.logInWithPermissions([
      'public_profile',
      'email',
    ]);

    if (loginResult.isCancelled) {
      return {success: false, error: 'Facebook login cancelled'};
    }

    const tokenData = await AccessToken.getCurrentAccessToken();
    if (!tokenData?.accessToken) {
      return {success: false, error: 'Failed to get Facebook token'};
    }

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

export const loginWithGoogle = async () => {
  try {
    console.log('📱 [GoogleSignIn] Starting...');
    const hasPlayServices = await GoogleSignin.hasPlayServices();
    console.log('📱 [GoogleSignIn] Play Services:', hasPlayServices);
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      return {success: false, error: 'No ID token from Google'};
    }

    const response = await fetch(`${API_BASE_URL}/riders/google-login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({idToken}),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      return {success: false, error: data?.message || 'Google login failed'};
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
    console.error('❌ [GoogleSignIn] Error:', err.message);
    return {success: false, error: err.message || 'Google login failed'};
  }
};

export const loginUser = authService.login;
export const registerUser = authService.register;
export const verifyEmail = authService.verifyEmail;
