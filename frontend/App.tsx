import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthProvider, useAuth} from './React/context/AuthContext';
import {setAuthContextRef} from './React/services/Apiclient';

import AuthScreen from './React/screens/AuthScreen';
import RiderPage from './React/pages/RiderPage';
import CreateRide from './React/pages/CreateRide';
import RideStep4 from './React/components/ride/RideStep4';
import StartedRide from './React/pages/StartedRide';
import RideRoutesPage from './React/components/ride/utilities/RideRoutesPage';
import RiderProfile from './React/pages/RiderProfile';
import HomeScreen from './React/pages/HomeScreen';

// Describes what useAuth() returns. Defined here because AuthContext is a
// .js file and TypeScript cannot infer its return type automatically.
interface AuthContextValue {  
  token: string | null;
  ready: boolean;
}

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="AuthScreen" component={AuthScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="RiderPage" component={RiderPage} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="CreateRide" component={CreateRide} />
    <Stack.Screen name="RideStep4" component={RideStep4} />
    <Stack.Screen name="StartedRide" component={StartedRide} />
    <Stack.Screen name="RideRoutesPage" component={RideRoutesPage} />
    <Stack.Screen name="RiderProfile" component={RiderProfile} />
  </Stack.Navigator>
);

const AppContent = () => {
  const auth = useAuth() as unknown as AuthContextValue;

  // Keep Apiclient in sync with the latest auth context on every render.
  setAuthContextRef(auth);

  // Block rendering until initializeAuth() finishes reading Keychain +
  // AsyncStorage. By the time ready flips to true, token is already set
  // (or left null if there was no stored session / restore failed).
  if (!auth.ready) {
    return null;
  }

  return (
    <NavigationContainer>
      {auth.token ? <AppStack /> : <AuthStack />}
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
