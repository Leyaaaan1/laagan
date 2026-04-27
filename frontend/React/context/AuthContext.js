import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {API_BASE_URL} from '../services/Apiclient';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(null); // Access token (in memory only)
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tokenRef = useRef(null);
  const refreshTokenRef = useRef(null);

  // Initialize on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Load refresh token from Keychain
      const credentials = await Keychain.getGenericPassword({
        service: 'com.ridershub.auth', // ✅ IMPORTANT: Specify service to match where it was stored
      });
      if (credentials && credentials.password) {
        refreshTokenRef.current = credentials.password;
        console.log('✅ Refresh token loaded from Keychain');
      }

      // Load username from AsyncStorage (not sensitive)
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
        console.log('✅ Username loaded:', storedUsername);
      }

      setReady(true);
      console.log('✅ Auth initialization complete');
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      setReady(true);
    }
  };

  /**
   * Save auth tokens after login
   * - Access token: in memory only (tokenRef + setToken)
   * - Refresh token: in Keychain (encrypted)
   * - Username: in AsyncStorage (not sensitive)
   */
  const saveAuth = async (newAccessToken, newRefreshToken, newUsername) => {
    try {
      console.log('💾 Saving auth tokens...');

      // 1. Store refresh token in Keychain (encrypted)
      await Keychain.setGenericPassword('userToken', newRefreshToken, {
        accessibilityLevel: Keychain.ACCESSIBLE_WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        service: 'com.ridershub.auth', // ✅ MUST match initializeAuth
      });

      // 2. Store username in AsyncStorage (not sensitive)
      await AsyncStorage.setItem('username', newUsername);

      // 3. Keep access token in memory only
      tokenRef.current = newAccessToken;
      setToken(newAccessToken);
      setUsername(newUsername);
      refreshTokenRef.current = newRefreshToken;

      console.log('✅ Auth tokens saved successfully');
      console.log('🔐 Access token available:', !!newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  };

  /**
   * Refresh access token using refresh token
   * Called automatically on 401 response
   */
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
        // Refresh failed — logout
        await clearAuth();
        return null;
      }

      const data = await response.json();
      tokenRef.current = data.accessToken;
      setToken(data.accessToken);
      refreshTokenRef.current = data.refreshToken;

      // Save new refresh token to Keychain
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

  /**
   * Clear all tokens on logout
   */
  const clearAuth = async () => {
    try {
      // Remove refresh token from Keychain
      await Keychain.resetGenericPassword({service: 'com.ridershub.auth'});
      // Remove username from AsyncStorage
      await AsyncStorage.removeItem('username');
      console.log('✅ Auth cleared');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }

    tokenRef.current = null;
    setToken(null);
    setUsername(null);
    refreshTokenRef.current = null;
  };

  /**
   * Logout: Notify backend to revoke tokens
   */
  const logout = async () => {
    try {
      if (tokenRef.current) {
        // Notify backend to blacklist token and revoke refresh tokens
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
      // Clear tokens locally regardless
      await clearAuth();
    }
  };

  // Read token from ref (always returns latest token)
  const getToken = () => {
    const currentToken = tokenRef.current;
    console.log(
      '🔐 getToken() called, returning:',
      currentToken ? '✅ Available' : '❌ null',
    );
    return currentToken;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        ready,
        saveAuth,
        clearAuth,
        logout,
        getToken,
        refreshAccessToken,
        isRefreshing,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
