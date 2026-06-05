import React, {useState, useCallback, useEffect} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  resendVerificationEmail,
} from '../services/authService';
import buttons from '../styles/base/buttons';
import text from '../styles/base/text';
import layout from '../styles/base/layout';
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';

const EmailVerificationScreen = ({navigation, route}) => {
  const {email} = route.params || {};
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendEmail = useCallback(async () => {
    if (countdown > 0) {
      Alert.alert(
        'Wait',
        `Please wait ${countdown} seconds before trying again.`,
      );
      return;
    }

    setResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        Alert.alert(
          ' Email Sent',
          'Verification email has been resent to your inbox.',
        );
        setCountdown(60); // 60 second cooldown
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to resend email');
      }
    } catch (error) {
      Alert.alert('❌ Error', 'Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  }, [email, countdown]);

  // Check if this screen was opened from a verified link
  useEffect(() => {
    if (route.params?.verified) {
      setVerified(true);
      setTimeout(() => {
        navigation.replace('AuthScreen', {showLoginSuccess: true});
      }, 2000);
    }
  }, [route.params?.verified, navigation]);

  return (
    <View
      style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <KeyboardAvoidingView
        style={layout.center}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Success State */}
        {verified ? (
          <>
            <Text
              style={[
                text.titleCenter,
                {marginBottom: spacing.lg, color: '#10b981'},
              ]}>
              🎉 VERIFIED!
            </Text>
            <Text
              style={[
                text.bodyMuted,
                {textAlign: 'center', marginBottom: spacing.lg},
              ]}>
              Your email has been verified successfully. Redirecting to login...
            </Text>
            <ActivityIndicator color="#10b981" size="large" />
          </>
        ) : (
          <>
            {/* Header */}
            <Text
              style={[
                text.titleCenter,
                {marginBottom: spacing.lg, letterSpacing: 1},
              ]}>
              VERIFY EMAIL
            </Text>

            <Text
              style={[
                text.bodyMuted,
                {textAlign: 'center', marginBottom: spacing.md},
              ]}>
              We've sent a verification link to:
            </Text>

            <Text
              style={[
                text.body,
                {
                  textAlign: 'center',
                  marginBottom: spacing.lg,
                  color: '#0ea5e9',
                  fontSize: 16,
                  fontWeight: '600',
                },
              ]}>
              {email}
            </Text>

            {/* Instructions */}
            <View
              style={[
                {marginBottom: spacing.lg, paddingHorizontal: spacing.lg},
              ]}>
              <Text style={[text.bodyMuted, {marginBottom: spacing.sm}]}>
                📧 Check your inbox and click the verification link to activate
                your account.
              </Text>
              <Text style={[text.bodyMuted, {color: '#f59e0b', fontSize: 12}]}>
                ⏱️ The link expires in 30 minutes.
              </Text>
            </View>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: '#1f2937',
                borderLeftWidth: 4,
                borderLeftColor: '#0ea5e9',
                borderRadius: 8,
                padding: spacing.md,
                marginBottom: spacing.lg,
                width: '85%',
              }}>
              <Text style={[text.bodySmall, {color: '#e5e7eb'}]}>
                💡{' '}
                <Text style={{fontWeight: '600'}}>Didn't get the email?</Text>
              </Text>
              <Text
                style={[
                  text.bodySmall,
                  {color: '#9ca3af', marginTop: spacing.sm},
                ]}>
                Check your spam folder or request a new verification link below.
              </Text>
            </View>

            {/* Resend Button */}
            <TouchableOpacity
              style={[
                buttons.pill,
                {
                  width: 280,
                  marginBottom: spacing.sm,
                  opacity: countdown > 0 || resending ? 0.7 : 1,
                  backgroundColor: countdown > 0 ? '#6b7280' : '#0ea5e9',
                },
              ]}
              onPress={handleResendEmail}
              disabled={countdown > 0 || resending}>
              {resending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[text.white, {fontSize: 16}]}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
                </Text>
              )}
            </TouchableOpacity>


            {/* Already Verified? */}
            <TouchableOpacity
              style={[buttons.ghost, {marginTop: spacing.md}]}
              onPress={() => navigation.replace('AuthScreen')}
              disabled={resending}>
              <Text style={text.muted}>Already verified? Go to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

export default EmailVerificationScreen;
