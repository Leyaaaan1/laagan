import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {API_BASE_URL, setAuthContextRef} from '../services/Apiclient';
import {
  saveTokenExpiry,
  clearTokenExpiry,
  getTimeUntilExpiry,
  clearCachedAccessToken,
  saveCachedAccessToken,
} from '../services/cache/tokenMetadata';
import {
  attemptOfflineRestore,
  checkNetworkStatus,
  getStoredCredentials,
} from '../utilities/offlineUtils';
const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showStayLoggedInDialog, setShowStayLoggedInDialog] = useState(false);
  const [userPreferAutoLogin, setUserPreferAutoLogin] = useState(true);

  const refreshTokenRef = useRef(null);
  const usernameRef = useRef(null);
  const refreshAccessTokenRef = useRef(null);
  const tokenRef = useRef(null);
  const syncApiclientRef = () => {
    setAuthContextRef({
      getToken: () => token, // Use `token` state instead of ref
      refreshAccessToken: (...args) => refreshAccessTokenRef.current?.(...args),
    });
  };

  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const completeOnboarding = () => setOnboardingCompleted(true);

  // REPLACE the initializeAuth function (lines 32-70):
  const initializeAuth = async () => {
    try {
      // 1. Load stored username
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        usernameRef.current = storedUsername;
        setUsername(storedUsername);
        console.log('✅ Username loaded:', storedUsername);
      }

      // 2. Check if user previously opted out of auto-login
      const autoLoginPref = await AsyncStorage.getItem('autoLoginPreference');
      if (autoLoginPref !== null) {
        setUserPreferAutoLogin(autoLoginPref === 'true');
      }

      // 3. Check network status
      const networkStatus = await checkNetworkStatus();
      console.log(
        `📡 Network status: ${
          networkStatus.isConnected ? 'ONLINE' : 'OFFLINE'
        } (${networkStatus.type})`,
      );

      // 4. Load refresh token from Keychain
      const credentials = await getStoredCredentials();

      if (credentials?.password && userPreferAutoLogin) {
        refreshTokenRef.current = credentials.password;
        console.log('✅ Refresh token found');

        // 5. ONLINE PATH: Exchange refresh token for fresh access token
        if (networkStatus.isConnected) {
          console.log('🌐 Online — attempting session refresh from server');
          syncApiclientRef();
          const restored = await restoreSession(credentials.password);
          if (!restored) {
            console.log('⚠️ Session restore failed — trying offline restore');
            // Fallback: Try offline restore even though we're online (in case API is down)
            const offlineResult = await attemptOfflineRestore();
            if (offlineResult.success) {
              tokenRef.current = offlineResult.token;
              setToken(offlineResult.token);
            }
          }
        } else {
          // 6. OFFLINE PATH: Try to restore from cached token
          console.log(
            '📵 Offline detected — attempting offline session restore',
          );
          const offlineResult = await attemptOfflineRestore();

          if (offlineResult.success) {
            // Use cached token
            tokenRef.current = offlineResult.token;
            setToken(offlineResult.token);
            console.log(
              `✅ Offline session restored (${offlineResult.reason})`,
            );
          } else {
            // Can't restore offline, will need to login
            console.log(
              `ℹ️ Offline restore failed: ${offlineResult.reason} — showing login screen`,
            );
          }
        }
      } else if (credentials?.password && !userPreferAutoLogin) {
        console.log('ℹ️ User chose not to auto-login — showing login screen');
      } else {
        console.log('ℹ️ No stored session — showing login screen');
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
    } finally {
      syncApiclientRef();
      setReady(true);
      console.log('✅ Auth initialization complete');
    }
  };
  // Silently exchange the stored refresh token for a new access token.
  // Returns true on success, false on failure (token invalid/expired).
  const restoreSession = async refreshToken => {
    try {
      const response = await fetch(`${API_BASE_URL}/riders/refresh`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({refreshToken}),
      });

      if (!response.ok) {
        // 401 here is expected when the user previously logged out — the server
        // already invalidated the token. Clear stale Keychain/storage silently.
        console.log(
          `ℹ️ Session restore: server rejected token (${response.status}) — clearing stale credentials`,
        );
        await _clearStorage();
        return false;
      }

      const data = await response.json();
      tokenRef.current = data.accessToken;
      refreshTokenRef.current = data.refreshToken;
      syncApiclientRef();
      setToken(data.accessToken);

      // Persist the rotated refresh token
      await Keychain.setGenericPassword('userToken', data.refreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth',
      });

      console.log('✅ Session restored successfully');
      return true;
    } catch (err) {
      console.error('❌ Session restore network error:', err);
      return false;
    }
  };

  useEffect(() => {
    // Keep tokenRef in sync with state for backwards compatibility with Apiclient
    tokenRef.current = token;
    syncApiclientRef();
  }, [token]);

  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // REPLACE saveAuth function (lines 117-144):

  // Replace lines 136-171:
  const saveAuth = async (
    newAccessToken,
    newRefreshToken,
    newUsername,
    onboardingDone = false,
    expiresIn = 3600,
  ) => {
    try {
      await _clearStorage();

      tokenRef.current = newAccessToken;
      refreshTokenRef.current = newRefreshToken;
      usernameRef.current = newUsername;

      syncApiclientRef();
      setToken(newAccessToken);
      setUsername(newUsername);
      setOnboardingCompleted(onboardingDone);
      // Save token expiry metadata
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
  // REPLACE refreshAccessToken function (lines 146-188):
  const refreshAccessToken = async () => {
    if (isRefreshing || !refreshTokenRef.current) {
      console.warn('⚠️ Cannot refresh: already refreshing or no refresh token');
      return null;
    }

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

        // NEW: Handle token refresh failure
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

      // NEW: Save token expiry
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
      setIsRefreshing(false);
    }
  };
  refreshAccessTokenRef.current = refreshAccessToken;

  const onTokenRefreshFailed = async message => {
    try {
      console.error('❌ Token refresh failed:', message);

      // Clear token metadata
      await clearTokenExpiry();

      // In a real app, show this notification to the user:
      // This function will be called from screens that have access to navigation/alerts
      // For now, we just log it and clear state

      // Re-export this in context so screens can call it
      return {shouldRedirectToAuth: true, message};
    } catch (err) {
      console.error('Failed to handle token refresh failure:', err);
    }
  };
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = async () => {
      const timeUntilExpiry = await getTimeUntilExpiry();
      if (timeUntilExpiry !== null && timeUntilExpiry < 5 * 60 * 1000) {
        // Token expiring in less than 5 minutes
        console.warn('⚠️ Token expiring soon, auto-refreshing...');
        await refreshAccessToken();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [token, isRefreshing]);

  // ─── Internal helper: wipe persisted credentials only (no state reset) ───

  // REPLACE _clearStorage function (lines 192-203):

  // Replace lines 270-287:
  const _clearStorage = async () => {
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
    try {
      await clearTokenExpiry();
      // ✅ clearTokenExpiry already clears cachedAccessToken
    } catch (err) {
      console.warn('⚠️ Token expiry clear warning:', err.message);
    }
  };
  // ─── Public: reset all auth state + persisted storage ───
  // Pass a callback to AuthProvider that will be called on logout

  // Replace lines 291-306:
  const clearAuth = async () => {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    usernameRef.current = null;
    syncApiclientRef();
    setToken(null);
    setUsername(null);

    // ✅ NEW: Clear cached token too
    await clearCachedAccessToken();

    if (contextValue?.onLogout) {
      contextValue.onLogout();
    }

    await _clearStorage();
    console.log('✅ Auth cleared');
  };
  const setAutoLoginPreference = async prefer => {
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

  const logout = async () => {
    // Clear storage FIRST so that even if the server call fails or the app
    // is killed mid-flight, stale tokens are never reused on next cold start.
    const currentToken = tokenRef.current;
    await clearAuth();

    // Best-effort server notification — fire and forget
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

  const deleteAccount = async () => {
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

  const getToken = () => tokenRef.current;
  const getUsername = () => usernameRef.current;

  useEffect(() => {
    syncApiclientRef();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ready]);

  const contextValue = {
    token,
    username,
    getUsername,
    ready,
    saveAuth,
    clearAuth,
    logout,
    deleteAccount,
    getToken,
    refreshAccessToken,
    isRefreshing,
    userPreferAutoLogin,
    setAutoLoginPreference,
    getTimeUntilExpiry, // NEW
    onTokenRefreshFailed, // NEW
    onboardingCompleted,
    completeOnboarding,
  };
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
