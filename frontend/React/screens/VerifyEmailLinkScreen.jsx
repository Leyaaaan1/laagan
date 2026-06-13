import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {verifyEmailToken} from '../services/authService';
import layout from '../styles/base/layout';
import text from '../styles/base/text';
import spacing from '../styles/tokens/spacing';

const VerifyEmailLinkScreen = ({navigation, route}) => {
  const {token} = route.params || {};
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        if (!token) {
          setError('Invalid verification link');
          return;
        }

        const result = await verifyEmailToken(token);

        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            navigation.replace('AuthScreen', {emailVerified: true});
          }, 2000);
        } else {
          setError(result.error || 'Verification failed');
        }
      } catch (err) {
        setError('An error occurred during verification');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigation]);

  return (
    <View
      style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={[text.body, {marginTop: spacing.md, color: '#e5e7eb'}]}>
            Verifying your email...
          </Text>
        </>
      ) : success ? (
        <>
          <Text
            style={[
              text.titleCenter,
              {color: '#10b981', marginBottom: spacing.md},
            ]}>
            ✅ Success!
          </Text>
          <Text style={[text.body, {color: '#e5e7eb', textAlign: 'center'}]}>
            Your email has been verified. Redirecting to login...
          </Text>
        </>
      ) : (
        <>
          <Text
            style={[
              text.titleCenter,
              {color: '#ef4444', marginBottom: spacing.md},
            ]}>
            ❌ Verification Failed
          </Text>
          <Text
            style={[
              text.body,
              {color: '#e5e7eb', textAlign: 'center', marginBottom: spacing.lg},
            ]}>
            {error}
          </Text>
        </>
      )}
    </View>
  );
};

export default VerifyEmailLinkScreen;
