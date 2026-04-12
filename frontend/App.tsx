
import React from 'react';

import {NavigationContainer} from '@react-navigation/native';
import MainNavigator from './React/navigation/MainNavigator';
import {AuthProvider} from './React/context/AuthContext';



export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
