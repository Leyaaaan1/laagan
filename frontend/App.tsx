import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './React/navigation/MainNavigator';
import { AuthProvider, useAuth } from './React/context/AuthContext';
import { setAuthContextRef } from './React/services/Apiclient';

const AppContent = () => {
  const auth = useAuth();

  useEffect(() => {
    setAuthContextRef(auth);
  }, [auth]);

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}