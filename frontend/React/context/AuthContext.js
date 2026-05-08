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
  // ── KEY FIX: username is also ref-backed ──────────────────────────────────
  // React state (setUsername) is async — by the time navigation happens and
  // RiderPage reads username from context, the state flush may not have run.
  // usernameRef.current is always synchronously up-to-date.
  const usernameRef = useRef(null);

  const refreshAccessTokenRef = useRef(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Sync Apiclient's authContextRef immediately (synchronous).
   * Never rely solely on useEffect for timing-critical paths like
   * post-registration navigation where useFocusEffect fires before
   * the next React render cycle.
   */
  const syncApiclientRef = () => {
    setAuthContextRef({
      getToken: () => tokenRef.current,
      refreshAccessToken: (...args) => refreshAccessTokenRef.current?.(...args),
    });
  };

  const initializeAuth = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'com.ridershub.auth',
      });
      if (credentials?.password) {
        refreshTokenRef.current = credentials.password;
        console.log('✅ Refresh token loaded from Keychain');
      }

      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        usernameRef.current = storedUsername;
        setUsername(storedUsername);
        console.log('✅ Username loaded:', storedUsername);
      }

      // Sync before setting ready so first fetch after init has the token
      syncApiclientRef();
      setReady(true);
      console.log('✅ Auth initialization complete');
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      syncApiclientRef();
      setReady(true);
    }
  };


  const saveAuth = async (newAccessToken, newRefreshToken, newUsername) => {
    try {
      console.log('💾 Saving auth tokens for user:', newUsername);

      // ✅ UPDATE REFS IMMEDIATELY (synchronously) - FIRST THING
      tokenRef.current = newAccessToken;
      refreshTokenRef.current = newRefreshToken;
      usernameRef.current = newUsername;

      console.log('✅ Refs updated immediately:', usernameRef.current);

      syncApiclientRef();
      setToken(newAccessToken);
      setUsername(newUsername);

      // ✅ NOW do the async storage operations
      await AsyncStorage.removeItem('username');

      // ✅ SafelyReset Keychain (don't fail if nothing to reset)
      try {
        await Keychain.resetGenericPassword();
      } catch (err) {
        console.warn('⚠️ Keychain reset warning (may be empty):', err.message);
      }

      await Keychain.setGenericPassword('userToken', newRefreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth',
      });

      await AsyncStorage.setItem('username', newUsername);

      console.log('✅ Storage operations complete');
      console.log(
        '✅ Final verification - usernameRef.current:',
        usernameRef.current,
      );
      console.log(
        '✅ Final verification - tokenRef.current:',
        tokenRef.current,
      );
      return newAccessToken;
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  };

  const refreshAccessToken = async () => {
    if (isRefreshing || !refreshTokenRef.current) {
      console.warn(
        '⚠️  Cannot refresh: already refreshing or no refresh token',
      );
      return null;
    }

    setIsRefreshing(true);
    try {
      console.log('🔄 Attempting to refresh access token...');

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

      console.log('✅ [Auth] Access token refreshed successfully');
      return data.accessToken;
    } catch (error) {
      console.error('❌ [Auth] Token refresh failed:', error);
      await clearAuth();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };
  refreshAccessTokenRef.current = refreshAccessToken;

  /**
   * Clear all auth state synchronously then clean up storage.
   */
  const clearAuth = async () => {
    // Wipe refs first — zero window for stale token to be read
    tokenRef.current = null;
    refreshTokenRef.current = null;
    usernameRef.current = null;

    // Sync Apiclient immediately so next request sees no token
    syncApiclientRef();

    setToken(null);
    setUsername(null);

    try {
      await Keychain.resetGenericPassword();
      await AsyncStorage.removeItem('username');
      console.log('✅ Auth cleared');
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }
  };

  const logout = async () => {
    try {
      if (tokenRef.current) {
        await fetch(`${API_BASE_URL}/riders/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error notifying backend of logout:', error);
    } finally {
      await clearAuth();
    }
  };

  const getToken = () => tokenRef.current;
  const getUsername = () => usernameRef.current;

  // Safety-net sync for any other state changes (e.g. token refresh)
  useEffect(() => {
    syncApiclientRef();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ready]);

  const contextValue = {
    token,
    username, // React state — triggers re-renders when it changes
    getUsername, // Ref-backed getter — always current, use when timing matters
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
