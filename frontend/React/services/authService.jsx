import {API_BASE_URL} from './Apiclient';
import {AccessToken, LoginManager} from 'react-native-fbsdk-next';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
// ─────────────────────────────────────────────────────────────────────────────
// safeJson
//
// Safely parses a fetch Response body as JSON without throwing.
// Returns null if the body is empty or malformed.
// ─────────────────────────────────────────────────────────────────────────────
const safeJson = async response => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export const authService = {
  // ───────────────────────────────────────────────────────────────────────────
  // login
  //
  // CHANGED: sends `email` instead of `username` in the request body.
  // The backend LoginRequest now expects an `email` field.
  //
  // CHANGED: response now includes `username` (the in-app display name
  // auto-generated or set during registration). We return it so AuthContext
  // can store it — the user never typed it, so we can't derive it locally.
  //
  // Was:  { username, password }  →  { accessToken, refreshToken }
  // Now:  { email, password }     →  { accessToken, refreshToken, username }
  // ───────────────────────────────────────────────────────────────────────────
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
          username: data.username, // in-app display name returned by server
        },
      };
    } catch (err) {
      console.error('❌ Login network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // register
  //
  // CHANGED: sends `email` + `password` only. No `username` in the body.
  // The backend auto-generates a username from the email local-part and stores
  // it on the Rider. The generated username is returned in the response.
  //
  // Example: email "juandelacruz@gmail.com" → username "juandelacruz"
  //          (with a numeric suffix if taken: "juandelacruz_2")
  //
  // Was:  { username, password }  →  { accessToken, refreshToken }
  // Now:  { email, password }     →  { accessToken, refreshToken, username }
  // ───────────────────────────────────────────────────────────────────────────
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
      return {
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          username: data.username, // auto-generated display name from server
        },
      };
    } catch (err) {
      console.error('❌ Register network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },


  verifyEmail: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/verify-email?token=${token}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const message = data?.message || 'Email verification failed';
        console.error('❌ Verification failed:', response.status, message);
        return {success: false, error: message};
      }
      return {success: true, message: data?.message};
    } catch (err) {
      console.error('❌ Verification network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // resendVerificationEmail
  //
  // Resend verification email to user's email address
  // ───────────────────────────────────────────────────────────────────────────
  resendVerificationEmail: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/resend-verification`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const message = data?.message || 'Failed to resend verification email';
        console.error('❌ Resend failed:', response.status, message);
        return {success: false, error: message};
      }
      return {success: true, message: data?.message};
    } catch (err) {
      console.error('❌ Resend network error:', err);
      return {success: false, error: err.message || 'Network error'};
    }
  },



  // ───────────────────────────────────────────────────────────────────────────
  // checkEmailVerified
  //
  // Check if an email has been verified
  // ───────────────────────────────────────────────────────────────────────────
  checkEmailVerified: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/check-email-verified?email=${email}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });
      const data = await safeJson(response);
      if (!response.ok) {
        return {success: false, verified: false};
      }
      return {success: true, verified: data?.verified};
    } catch (err) {
      console.error('❌ Check verification network error:', err);
      return {success: false, verified: false};
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


  // ───────────────────────────────────────────────────────────────────────────
  // logout
  //
  // Unchanged — logout is token-based, not tied to email or username.
  // ───────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// loginWithFacebook
//
// Unchanged in logic — the backend already returns `username` (display name)
// from FacebookLoginController, and AuthScreen already reads it from
// result.data.username. No changes needed here.
// ─────────────────────────────────────────────────────────────────────────────
export const loginWithFacebook = async () => {
  try {
    // 1. Open native Facebook login dialog
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

    // 3. Send Facebook token to the Spring backend.
    //    Backend verifies with Facebook Graph API and returns our own JWT tokens
    //    plus the rider's display username.
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
        username: data.username, // display name derived from FB name
      },
    };
  } catch (err) {
    console.error('❌ Facebook login error:', err);
    return {success: false, error: err.message || 'Facebook login failed'};
  }
};

const verifyEmail = async token => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/riders/verify-email?token=${token}`,
      {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      },
    );
    const data = await safeJson(response);
    if (!response.ok) {
      const message = data?.message || 'Email verification failed';
      console.error('❌ Verification failed:', response.status, message);
      return {success: false, error: message};
    }
    return {success: true, message: data?.message};
  } catch (err) {
    console.error('❌ Verification network error:', err);
    return {success: false, error: err.message || 'Network error'};
  }
};





export const loginWithGoogle = async () => {
  try {
    console.log('📱 [GoogleSignIn] Starting...');

    const hasPlayServices = await GoogleSignin.hasPlayServices();
    console.log('📱 [GoogleSignIn] Play Services:', hasPlayServices);

    console.log('📱 [GoogleSignIn] Calling signIn()...');
    const userInfo = await GoogleSignin.signIn();
    console.log('📱 [GoogleSignIn] Success:', userInfo);
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      console.log('❌ [GoogleSignIn] No ID token received');
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
      data: {accessToken: data.accessToken, refreshToken: data.refreshToken, username: data.username},
    };
  } catch (err) {
    return {success: false, error: err.message || 'Google login failed'};
  }
};



export const loginUser = authService.login;
export const registerUser = authService.register;
export const verifyEmailToken = verifyEmail;
export const resendVerificationEmail = resendVerificationEmail;
export const checkEmailVerified = checkEmailVerified;