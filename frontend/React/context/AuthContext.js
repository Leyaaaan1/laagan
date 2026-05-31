import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {setAuthContextRef} from '../services/Apiclient';
import {
  saveTokenExpiry,
  clearTokenExpiry,
  getTimeUntilExpiry,
  clearCachedAccessToken,
  saveCachedAccessToken,
} from '../services/cache/tokenMetadata';
import {
  initializeAuth as initAuth,
  restoreSession as restore,
  createSaveAuth,
  createRefreshAccessToken,
  createOnTokenRefreshFailed,
  createLogout,
  createDeleteAccount,
  createSetAutoLoginPreference,
  createClearStorage,
  createClearAuth,
} from '../context/utilities/authContextUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [userPreferAutoLogin, setUserPreferAutoLogin] = useState(true);
  const userPreferAutoLoginRef = useRef(true);

  const refreshTokenRef = useRef(null);
  const usernameRef = useRef(null);
  const refreshAccessTokenRef = useRef(null);
  const tokenRef = useRef(null);
  const isRefreshingRef = useRef(false);

  const syncApiclientRef = () => {
    setAuthContextRef({
      getToken: () => tokenRef.current,
      refreshAccessToken: (...args) => refreshAccessTokenRef.current?.(...args),
    });
  };

  // ─── Initialize auth on mount ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await initAuth({
        setUsername,
        usernameRef,
        setUserPreferAutoLogin,
        userPreferAutoLoginRef,
        setToken,
        tokenRef,
        restoreSession: restore,
        syncApiclientRef,
      });
      syncApiclientRef();
      setReady(true);
      console.log('✅ Auth initialization complete');
    };

    init();
  }, []);

  // ─── Keep tokenRef in sync with state ────────────────────────────────────
  useEffect(() => {
    tokenRef.current = token;
    syncApiclientRef();
  }, [token]);

  // ─── Save auth tokens after login / verification ─────────────────────────
  const _clearStorage = createClearStorage();

  const saveAuth = createSaveAuth({
    tokenRef,
    refreshTokenRef,
    usernameRef,
    syncApiclientRef,
    setToken,
    setUsername,
    _clearStorage,
    saveTokenExpiry,
    saveCachedAccessToken,
  });

  // ─── Refresh access token (called by Apiclient on 401) ───────────────────
  const refreshAccessToken = createRefreshAccessToken({
    isRefreshingRef,
    refreshTokenRef,
    setIsRefreshing,
    tokenRef,
    syncApiclientRef,
    setToken,
    saveTokenExpiry,
    onTokenRefreshFailed: createOnTokenRefreshFailed({clearTokenExpiry}),
    clearAuth: createClearAuth({
      tokenRef,
      refreshTokenRef,
      usernameRef,
      syncApiclientRef,
      setToken,
      setUsername,
      clearCachedAccessToken,
      _clearStorage,
    }),
  });

  refreshAccessTokenRef.current = refreshAccessToken;

  const onTokenRefreshFailed = createOnTokenRefreshFailed({clearTokenExpiry});

  // ─── Proactive token expiry check (every 60s while logged in) ────────────
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = async () => {
      if (isRefreshingRef.current) return;
      const timeUntilExpiry = await getTimeUntilExpiry();
      if (timeUntilExpiry !== null && timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('⚠️ Token expiring soon, auto-refreshing...');
        await refreshAccessToken();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  // ─── Public: reset all auth state + persisted storage ────────────────────
  const clearAuth = createClearAuth({
    tokenRef,
    refreshTokenRef,
    usernameRef,
    syncApiclientRef,
    setToken,
    setUsername,
    clearCachedAccessToken,
    _clearStorage,
  });

  const setAutoLoginPreference = createSetAutoLoginPreference({
    userPreferAutoLoginRef,
    setUserPreferAutoLogin,
  });

  const logout = createLogout({
    tokenRef,
    clearAuth,
  });

  const deleteAccount = createDeleteAccount({
    tokenRef,
    clearAuth,
  });

  const getToken = () => tokenRef.current;
  const getUsername = () => usernameRef.current;

  useEffect(() => {
    syncApiclientRef();
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
    getTimeUntilExpiry,
    onTokenRefreshFailed,
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
