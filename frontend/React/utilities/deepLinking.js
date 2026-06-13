import {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Linking} from 'react-native';

export const useDeepLinking = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle deep link when app is running
    const handleDeepLink = ({url}) => {


      if (url.includes('verify-email')) {
        const token = new URL(url).searchParams.get('token');
        if (token) {
          navigation.navigate('VerifyEmailLink', {token});
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep link when app launches from deep link
    const checkInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url != null && url.includes('verify-email')) {
        const token = new URL(url).searchParams.get('token');
        if (token) {
          navigation.navigate('VerifyEmailLink', {token});
        }
      }
    };

    checkInitialURL();

    return () => {
      subscription.remove();
    };
  }, [navigation]);
};
