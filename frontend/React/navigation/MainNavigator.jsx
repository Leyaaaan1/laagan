import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../pages/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import RiderPage from '../pages/RiderPage';
import CreateRide from '../pages/CreateRide';
import RideStep4 from '../components/ride/RideStep4';
import StartedRide from '../pages/StartedRide';
import RideRoutesPage from '../components/ride/util/RideRoutesPage';
import RideSwipeContainer from './RideSwipeContainer';
const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="AuthScreen" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AuthScreen" component={AuthScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RiderPage" component={RiderPage} />
            <Stack.Screen name="CreateRide" component={CreateRide} />
            <Stack.Screen name="RideStep4" component={RideStep4} />
            <Stack.Screen name="StartedRide" component={StartedRide} />
            <Stack.Screen name="RideRoutesPage" component={RideRoutesPage} />
          <Stack.Screen name="RideSwipeContainer" component={RideSwipeContainer} />

        </Stack.Navigator>
    );
};

export default MainNavigator;
