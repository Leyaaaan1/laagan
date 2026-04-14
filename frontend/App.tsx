
import React, {useEffect} from 'react';

import {NavigationContainer} from '@react-navigation/native';
import MainNavigator from './React/navigation/MainNavigator';
import {AuthProvider, useAuth} from './React/context/AuthContext';
import {setAuthContextRef} from './React/services/Apiclient';



export default function App() {
  const auth = useAuth();

  useEffect(() => {
    setAuthContextRef(auth);
  }, [auth]);
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
