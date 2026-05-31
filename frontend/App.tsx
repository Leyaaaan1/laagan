import React, {useEffect, useState} from 'react';
import {Linking} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthProvider, useAuth} from './React/context/AuthContext';
import {RideProvider} from './React/context/RideContext';
import {setAuthContextRef} from './React/services/Apiclient';

import AuthScreen from './React/screens/AuthScreen';
import RiderPage from './React/pages/RiderPage';
import CreateRide from './React/pages/CreateRide';
import RideStep4 from './React/components/ride/RideStep4';
import StartedRide from './React/pages/StartedRide';
import RideRoutesPage from './React/components/ride/utilities/RideRoutesPage';
import RiderProfile from './React/pages/RiderProfile';
import HomeScreen from './React/screens/HomeScreen';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GOOGLE_CLIENT_ID} from '@env';
import LoadingScreen from './React/commons/LoadingScreen';
import LegalScreen from './React/screens/LegalScreen';
import FinishedRideView from './React/pages/finishedRide/FinishedRideView';
import PersonalSummaryView from './React/pages/finishedRide/PersonalSummaryView';

interface AuthContextValue {
  token: string | null;
  ready: boolean;
}

const Stack = createNativeStackNavigator();
export const googleclientid = GOOGLE_CLIENT_ID;

// FIX: Accept initialUrl and pass it to AuthScreen so PendingVerificationScreen
// can process it even when the app was cold-started from the Gmail link.
const AuthStack = ({initialUrl}: {initialUrl: string | null}) => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen
      name="AuthScreen"
      component={AuthScreen}
      initialParams={{initialUrl}}
    />
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
    <Stack.Screen name="LegalScreen" component={LegalScreen} />
    <Stack.Screen name="FinishedRideView" component={FinishedRideView} />
    <Stack.Screen name="PersonalSummaryView" component={PersonalSummaryView} />
  </Stack.Navigator>
);

const AppContent = () => {
  const auth = useAuth() as unknown as AuthContextValue;
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [urlChecked, setUrlChecked] = useState(false);

  setAuthContextRef(auth);

  GoogleSignin.configure({
    webClientId: googleclientid,
    offlineAccess: true,
  });

  // FIX: Capture the launch URL before rendering anything.
  // On cold start from a deep link, getInitialURL() returns the ridershub:// URL.
  // We wait for this check before rendering so we can pass it to AuthScreen.
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      console.log('🔗 [App] Initial URL:', url);
      setInitialUrl(url ?? null);
      setUrlChecked(true);
    });
  }, []);

  if (!auth.ready || !urlChecked) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {auth.token ? <AppStack /> : <AuthStack initialUrl={initialUrl} />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RideProvider>
        <AppContent />
      </RideProvider>
    </AuthProvider>
  );
}
