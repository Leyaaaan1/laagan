import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef(null);

  useEffect(() => {
    AsyncStorage.multiGet(['userToken', 'username'])
      .then(pairs => {
        const storedToken = pairs[0]?.[1] ?? null;
        const storedUsername = pairs[1]?.[1] ?? null;
        tokenRef.current = storedToken;
        setToken(storedToken);
        setUsername(storedUsername);
        setReady(true);
      })
      .catch(err => {
        console.error('Failed to load auth:', err);
        setReady(true);
      });
  }, []);

  const saveAuth = async (newToken, newUsername) => {
    await AsyncStorage.multiSet([
      ['userToken', newToken],
      ['username', newUsername],
    ]);
    tokenRef.current = newToken;
    setToken(newToken);
    setUsername(newUsername);
    return newToken;
  };

  const clearAuth = async () => {
    await AsyncStorage.multiRemove(['userToken', 'username']);
    tokenRef.current = null;
    setToken(null);
    setUsername(null);
  };

  // Reads from ref — always returns the latest token even before re-render
  const getToken = () => tokenRef.current;

  return (
    <AuthContext.Provider
      value={{token, username, ready, saveAuth, clearAuth, getToken}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
