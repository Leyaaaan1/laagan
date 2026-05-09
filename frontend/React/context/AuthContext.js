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

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tokenRef = useRef(null);
  const refreshTokenRef = useRef(null);
  const usernameRef = useRef(null);
  const refreshAccessTokenRef = useRef(null);

  const syncApiclientRef = () => {
    setAuthContextRef({
      getToken: () => tokenRef.current,
      refreshAccessToken: (...args) => refreshAccessTokenRef.current?.(...args),
    });
  };

  const initializeAuth = async () => {
    try {
      // 1. Load stored username
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        usernameRef.current = storedUsername;
        setUsername(storedUsername);
        console.log('✅ Username loaded:', storedUsername);
      }

      // 2. Load refresh token from Keychain
      const credentials = await Keychain.getGenericPassword({
        service: 'com.ridershub.auth',
      });

      if (credentials?.password) {
        refreshTokenRef.current = credentials.password;
        console.log('✅ Refresh token found — attempting session restore');

        // 3. Exchange stored refresh token for a fresh access token.
        syncApiclientRef(); // needed before calling refresh
        const restored = await restoreSession(credentials.password);
        if (!restored) {
          // Token was invalid/expired (e.g. user logged out on another device,
          // or server restarted and revoked tokens). This is expected — silently
          // drop to login screen. Storage was already cleared inside restoreSession.
          console.log('ℹ️ Session restore failed — showing login screen');
        }
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
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAuth = async (newAccessToken, newRefreshToken, newUsername) => {
    try {
      console.log('💾 Saving auth tokens for user:', newUsername);

      tokenRef.current = newAccessToken;
      refreshTokenRef.current = newRefreshToken;
      usernameRef.current = newUsername;

      syncApiclientRef();
      setToken(newAccessToken);
      setUsername(newUsername);

      await _clearStorage();

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
        await clearAuth();
        return null;
      }

      const data = await response.json();
      tokenRef.current = data.accessToken;
      refreshTokenRef.current = data.refreshToken;
      syncApiclientRef();
      setToken(data.accessToken);

      await Keychain.setGenericPassword('userToken', data.refreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth',
      });

      console.log('✅ Access token refreshed');
      return data.accessToken;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await clearAuth();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };
  refreshAccessTokenRef.current = refreshAccessToken;

  // ─── Internal helper: wipe persisted credentials only (no state reset) ───
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
  };

  // ─── Public: reset all auth state + persisted storage ───
  const clearAuth = async () => {
    tokenRef.current = null;
    refreshTokenRef.current = null;
    usernameRef.current = null;
    syncApiclientRef();
    setToken(null);
    setUsername(null);
    await _clearStorage();
    console.log('✅ Auth cleared');
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
    getToken,
    refreshAccessToken,
    isRefreshing,
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
