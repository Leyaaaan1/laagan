import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  attemptOfflineRestore,
  checkNetworkStatus,
  getStoredCredentials,
} from '../../utilities/offlineUtils';
import {API_BASE_URL} from '../../services/Apiclient';


// ─────────────────────────────────────────────────────────────────────────────
// Initialize Auth
// ─────────────────────────────────────────────────────────────────────────────
export const initializeAuth = async ({
  setUsername,
  usernameRef,
  setUserPreferAutoLogin,
  userPreferAutoLoginRef,
  setToken,
  tokenRef,
  restoreSession,
  syncApiclientRef,
}) => {
  try {
    const storedUsername = await AsyncStorage.getItem('username');
    if (storedUsername) {
      usernameRef.current = storedUsername;
      setUsername(storedUsername);
      console.log('✅ Username loaded:', storedUsername);
    }

    const autoLoginPref = await AsyncStorage.getItem('autoLoginPreference');
    const wantsAutoLogin = autoLoginPref === null || autoLoginPref === 'true';
    userPreferAutoLoginRef.current = wantsAutoLogin;
    setUserPreferAutoLogin(wantsAutoLogin);

    const networkStatus = await checkNetworkStatus();
    console.log(
      `📡 Network status: ${networkStatus.isConnected ? 'ONLINE' : 'OFFLINE'}`,
    );

    const credentials = await getStoredCredentials();

    if (credentials?.password && userPreferAutoLoginRef.current) {
      console.log('✅ Refresh token found');

      if (networkStatus.isConnected) {
        console.log('🌐 Online — attempting session refresh from server');
        syncApiclientRef();

        // ✅ FIX: restoreSession now returns the new access token
        const newAccessToken = await restoreSession(credentials.password);

        if (newAccessToken) {
          // ✅ FIX: actually update state with the restored token
          tokenRef.current = newAccessToken;
          setToken(newAccessToken);
          console.log('✅ Token state updated after session restore');
        } else {
          console.log('⚠️ Session restore failed — trying offline restore');
          const offlineResult = await attemptOfflineRestore();
          if (offlineResult.success) {
            tokenRef.current = offlineResult.token;
            setToken(offlineResult.token);
          }
        }
      } else {
        console.log('📵 Offline — attempting offline session restore');
        const offlineResult = await attemptOfflineRestore();

        if (offlineResult.success) {
          tokenRef.current = offlineResult.token;
          setToken(offlineResult.token);
          console.log(`✅ Offline session restored (${offlineResult.reason})`);
        } else {
          console.log(`ℹ️ Offline restore failed: ${offlineResult.reason}`);
        }
      }
    } else if (credentials?.password && !userPreferAutoLoginRef.current) {
      console.log('ℹ️ User chose not to auto-login');
    } else {
      console.log('ℹ️ No stored session — showing login screen');
    }
  } catch (err) {
    console.error('Failed to initialize auth:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Restore Session
// ─────────────────────────────────────────────────────────────────────────────
export const restoreSession = async refreshToken => {
  try {
    const response = await fetch(`${API_BASE_URL}/riders/refresh`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refreshToken}),
    });

    if (!response.ok) {
      console.log(
        `ℹ️ Session restore: server rejected token (${response.status}) — clearing stale credentials`,
      );
      return null; // ← was returning false; now returns null to signal failure
    }

    const data = await response.json();
    console.log('✅ Session restored successfully');
    // ✅ Return the new access token so the caller can update state
    return data.accessToken ?? null;
  } catch (err) {
    console.error('❌ Session restore network error:', err);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Clear Storage (internal helper)
// ─────────────────────────────────────────────────────────────────────────────
export const createClearStorage = () => {
  return async () => {
    try {
      await Keychain.resetGenericPassword({service: 'com.ridershub.auth'});
    } catch (err) {
      console.warn('⚠️ Keychain reset warning:', err.message);
    }
    try {
      await AsyncStorage.removeItem('username');
    } catch (err) {
      console.warn('⚠️ AsyncStorage remove warning:', err.message);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Save Auth
// ─────────────────────────────────────────────────────────────────────────────
export const createSaveAuth = ({
  tokenRef,
  refreshTokenRef,
  usernameRef,
  syncApiclientRef,
  setToken,
  setUsername,
  _clearStorage,
  saveTokenExpiry,
  saveCachedAccessToken,
}) => {
  return async (
    newAccessToken,
    newRefreshToken,
    newUsername,
    expiresIn = 3600,
  ) => {
    try {
      console.log('💾 Saving auth tokens for user:', newUsername);

      await _clearStorage();

      tokenRef.current = newAccessToken;
      refreshTokenRef.current = newRefreshToken;
      usernameRef.current = newUsername;

      syncApiclientRef();
      setToken(newAccessToken);
      setUsername(newUsername);

      await saveTokenExpiry(expiresIn);
      await saveCachedAccessToken(newAccessToken);

      await Keychain.setGenericPassword('userToken', newRefreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth',
      });

      await AsyncStorage.setItem('username', newUsername);

      console.log('✅ Auth saved for:', newUsername);
      return newAccessToken;
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// On Token Refresh Failed
// ─────────────────────────────────────────────────────────────────────────────
export const createOnTokenRefreshFailed = ({clearTokenExpiry}) => {
  return async message => {
    try {
      console.error('❌ Token refresh failed:', message);
      await clearTokenExpiry();
      return {shouldRedirectToAuth: true, message};
    } catch (err) {
      console.error('Failed to handle token refresh failure:', err);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Access Token
// ─────────────────────────────────────────────────────────────────────────────
export const createRefreshAccessToken = ({
  isRefreshingRef,
  refreshTokenRef,
  setIsRefreshing,
  tokenRef,
  syncApiclientRef,
  setToken,
  saveTokenExpiry,
  onTokenRefreshFailed,
  clearAuth,
}) => {
  return async () => {
    if (isRefreshingRef.current || !refreshTokenRef.current) {
      console.warn('⚠️ Cannot refresh: already refreshing or no refresh token');
      return null;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing access token...');

      const response = await fetch(`${API_BASE_URL}/riders/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken: refreshTokenRef.current}),
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status);

        if (response.status === 401 || response.status === 403) {
          await onTokenRefreshFailed(
            'Your session has expired. Please login again.',
          );
        }

        await clearAuth();
        return null;
      }

      const data = await response.json();
      tokenRef.current = data.accessToken;
      refreshTokenRef.current = data.refreshToken;
      syncApiclientRef();
      setToken(data.accessToken);

      const expiresIn = data.expiresIn || 3600;
      await saveTokenExpiry(expiresIn);

      await Keychain.setGenericPassword('userToken', data.refreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth',
      });

      console.log('✅ Access token refreshed');
      return data.accessToken;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await onTokenRefreshFailed(
        'Network error while refreshing session. Please try again.',
      );
      await clearAuth();
      return null;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Clear Auth
// ─────────────────────────────────────────────────────────────────────────────
export const createClearAuth = ({
  tokenRef,
  refreshTokenRef,
  usernameRef,
  syncApiclientRef,
  setToken,
  setUsername,
  clearCachedAccessToken,
  _clearStorage,
}) => {
  return async () => {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    usernameRef.current = null;
    syncApiclientRef();
    setToken(null);
    setUsername(null);

    await clearCachedAccessToken();
    await _clearStorage();
    console.log('✅ Auth cleared');
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Set Auto-Login Preference
// ─────────────────────────────────────────────────────────────────────────────
export const createSetAutoLoginPreference = ({
  userPreferAutoLoginRef,
  setUserPreferAutoLogin,
}) => {
  return async prefer => {
    userPreferAutoLoginRef.current = prefer;
    setUserPreferAutoLogin(prefer);
    try {
      await AsyncStorage.setItem(
        'autoLoginPreference',
        prefer ? 'true' : 'false',
      );
      console.log(`✅ Auto-login preference set to: ${prefer}`);
    } catch (err) {
      console.error('Failed to save auto-login preference:', err);
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────
export const createLogout = ({tokenRef, clearAuth}) => {
  return async () => {
    const currentToken = tokenRef.current;
    await clearAuth();

    if (currentToken) {
      fetch(`${API_BASE_URL}/riders/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.warn(
          '⚠️ Logout notification to server failed (non-fatal):',
          err.message,
        );
      });
    }
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete Account
// ─────────────────────────────────────────────────────────────────────────────
export const createDeleteAccount = ({tokenRef, clearAuth}) => {
  return async () => {
    const currentToken = tokenRef.current;
    await clearAuth();

    if (currentToken) {
      fetch(`${API_BASE_URL}/riders/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.warn(
          '⚠️ Delete account server call failed (non-fatal):',
          err.message,
        );
      });
    }
  };
};
