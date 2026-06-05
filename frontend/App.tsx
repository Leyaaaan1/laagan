import React, {useEffect, useState} from 'react';
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
import LoadingScreen from '../frontend/React/commons/LoadingScreen';
import LegalScreen from '../frontend/React/screens/LegalScreen';
import FinishedRideView from './React/pages/finishedRide/FinishedRideView';
import PersonalSummaryView from './React/pages/finishedRide/PersonalSummaryView';
import {useDeepLinking} from './React/utilities/deepLinking';
import EmailVerificationScreen from './React/screens/EmailVerificationScreen';
import VerifyEmailLinkScreen from './React/screens/VerifyEmailLinkScreen';
// ─── ADD these two imports ───────────────────────────────────────────────────
import OnboardingTour, {ONBOARDING_KEY} from './React/screens/OnboardingTour';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextValue {
  token: string | null;
  ready: boolean;
  onboardingCompleted: boolean;
}

const Stack = createNativeStackNavigator();
export const googleclientid = GOOGLE_CLIENT_ID;

const AuthStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="AuthScreen" component={AuthScreen} />
    <Stack.Screen
      name="EmailVerification"
      component={EmailVerificationScreen}
    />
    <Stack.Screen name="VerifyEmailLink" component={VerifyEmailLinkScreen} />
  </Stack.Navigator>
);

const AppStack = ({initialRoute = 'OnboardingTour'}) => (
  <Stack.Navigator
    screenOptions={{headerShown: false}}
    initialRouteName={initialRoute}>
    <Stack.Screen name="OnboardingTour" component={OnboardingTour} />
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

const NavigationContent = () => {
  const auth = useAuth() as unknown as AuthContextValue;

  useDeepLinking();
  setAuthContextRef(auth);
  GoogleSignin.configure({webClientId: googleclientid, offlineAccess: false});

  if (!auth.ready) {return <LoadingScreen />;}
  if (!auth.token) {return <AuthStack />;}

  // No more AsyncStorage! Reads directly from context
  return (
    <AppStack
      initialRoute={auth.onboardingCompleted ? 'RiderPage' : 'OnboardingTour'}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RideProvider>
        <NavigationContainer>
          <NavigationContent />
        </NavigationContainer>
      </RideProvider>
    </AuthProvider>
  );
}
