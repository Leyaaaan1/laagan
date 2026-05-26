import React, {useEffect} from 'react';
import {BackHandler} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import RiderPage from '../pages/RiderPage';
import CreateRide from '../pages/CreateRide';
import RideStep4 from '../components/ride/RideStep4';
import StartedRide from '../pages/StartedRide';
import RideRoutesPage from '../components/ride/utilities/RideRoutesPage';
import RiderProfile from '../pages/RiderProfile';
import {useAuth} from '../context/AuthContext';
import LegalScreen from '../screens/LegalScreen';
import FinishedRideView from '../pages/finishedRide/FinishedRideView';
import PersonalSummaryView from '../pages/finishedRide/PersonalSummaryView';

const Stack = createNativeStackNavigator();

const MainNavigator = ({navigationRef}) => {
  const {getToken, token} = useAuth();
  const isLoggedIn = !!token || !!getToken?.();

  // Close the app only when back is pressed on the root screen.
  // navigationRef is passed from NavigationContainer in App.tsx.
  useEffect(() => {
    const onBackPress = () => {
      if (!navigationRef?.current?.isReady()) return false;

      const state = navigationRef.current.getState();
      const routes = state?.routes ?? [];
      const topRoute = routes[state?.index ?? routes.length - 1];

      // Only exit if we're sitting on RiderPage with nothing behind it
      if (topRoute?.name === 'RiderPage' && routes.length === 1) {
        BackHandler.exitApp();
        return true;
      }

      return false; // let RN pop the screen normally
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigationRef]);

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'RiderPage' : 'AuthScreen'}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="AuthScreen" component={AuthScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RiderPage" component={RiderPage} />
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
};

export default MainNavigator;
