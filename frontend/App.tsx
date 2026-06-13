import EventSource from 'react-native-sse';
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
import OnboardingTour from './React/screens/OnboardingTour';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextValue {
  token: string | null;
  ready: boolean;
}
interface OnboardingParams {
  completed?: boolean;
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
    <Stack.Screen name="LegalScreen" component={LegalScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{headerShown: false}}>
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
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useDeepLinking();
  setAuthContextRef(auth);
  GoogleSignin.configure({webClientId: googleclientid, offlineAccess: false});

  useEffect(() => {
    AsyncStorage.getItem('@rideapp_onboarding_done').then(val => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (!auth.ready || onboardingDone === null) return <LoadingScreen />;

  if (!onboardingDone) {
    return (
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        screenListeners={{
          state: async e => {
            const route = e.data?.state?.routes?.find(
              r => r.name === 'OnboardingTour',
            );
            if ((route?.params as OnboardingParams)?.completed) {
              await AsyncStorage.setItem('@rideapp_onboarding_done', 'true');
              setOnboardingDone(true);
            }
          },
        }}>
        <Stack.Screen name="OnboardingTour" component={OnboardingTour} />
      </Stack.Navigator>
    );
  }
  if (!auth.token) return <AuthStack />;
  return <AppStack />;
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
