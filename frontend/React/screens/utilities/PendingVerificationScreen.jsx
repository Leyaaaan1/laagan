import React, {useRef, useState, useEffect} from 'react';
import {
  Animated,
  Linking,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import layout from '../../styles/base/layout';
import buttons from '../../styles/base/buttons';
import text from '../../styles/base/text';
import colors from '../../styles/tokens/colors';
import spacing from '../../styles/tokens/spacing';

// ─────────────────────────────────────────────────────────────────────────────
// VerifyingState Component
// ─────────────────────────────────────────────────────────────────────────────
const VerifyingState = () => (
  <View
    style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.black} />
    <ActivityIndicator
      color={colors.white}
      size="large"
      style={{marginBottom: spacing.lg}}
    />
    <Text style={[text.titleCenter, {marginBottom: spacing.sm}]}>
      Verifying
    </Text>
    <Text style={[text.bodyMuted, {textAlign: 'center'}]}>
      Confirming your email address{'\n'}and creating your account…
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState Component
// ─────────────────────────────────────────────────────────────────────────────
const ErrorState = ({errorMessage, onRetry, onBack}) => (
  <View
    style={[
      layout.screen,
      {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      },
    ]}>
    <StatusBar barStyle="light-content" backgroundColor={colors.black} />
    <Text style={{fontSize: 48, marginBottom: spacing.lg, textAlign: 'center'}}>
      ✕
    </Text>
    <Text style={[text.titleCenter, {marginBottom: spacing.sm}]}>
      Verification Failed
    </Text>
    <Text
      style={[text.bodyMuted, {textAlign: 'center', marginBottom: spacing.lg}]}>
      {errorMessage}
    </Text>
    <TouchableOpacity
      style={[buttons.pill, {width: 280, marginBottom: spacing.sm}]}
      onPress={onRetry}>
      <Text style={[text.white, {fontSize: 16}]}>Try Again</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[buttons.ghost, {marginTop: spacing.xs}]}
      onPress={onBack}>
      <Text style={text.muted}>Back to Login</Text>
    </TouchableOpacity>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// WaitingState Component
// ─────────────────────────────────────────────────────────────────────────────
const WaitingState = ({
  pendingEmail,
  onBack,
  onManualRetry,
  pulseAnim,
  dotCount,
}) => {
  const dots = '.'.repeat(dotCount);

  return (
    <View
      style={[
        layout.screen,
        {alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32},
      ]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />

      <Animated.Text
        style={{
          fontSize: 64,
          marginBottom: spacing.lg,
          opacity: pulseAnim,
          textAlign: 'center',
        }}>
        ✉️
      </Animated.Text>

      <Text
        style={[
          text.titleCenter,
          {marginBottom: spacing.sm, letterSpacing: 1},
        ]}>
        CHECK YOUR EMAIL
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {textAlign: 'center', marginBottom: spacing.lg, letterSpacing: 0.5},
        ]}>
        Waiting for verification{dots}
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {
            textAlign: 'center',
            marginBottom: spacing.lg,
            paddingHorizontal: 8,
            lineHeight: 22,
          },
        ]}>
        We sent a link to{'\n'}
        <Text style={{color: colors.white, fontWeight: '600'}}>
          {pendingEmail}
        </Text>
        {'\n\n'}
        Open your email app and tap the link to complete registration. This
        screen will update automatically once verified.
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: '#334155',
          borderRadius: 10,
          padding: spacing.md,
          marginBottom: spacing.lg,
          width: '100%',
        }}>
        <Text
          style={[
            text.bodyMuted,
            {textAlign: 'center', fontSize: 13, lineHeight: 20},
          ]}>
          💡 Check your spam folder if you don't see it within a minute.
          {'\n'}The link expires in 24 hours.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          buttons.pill,
          {width: 280, marginBottom: spacing.sm, backgroundColor: '#1e293b'},
        ]}
        onPress={onManualRetry}>
        <Text style={[text.white, {fontSize: 14}]}>
          I already clicked the link
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[buttons.ghost, {marginTop: spacing.xs}]}
        onPress={onBack}>
        <Text style={text.muted}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PendingVerificationScreen Component
// ─────────────────────────────────────────────────────────────────────────────
export const PendingVerificationScreen = ({
                                            pendingEmail,
                                            onBack,
                                            onVerified,
                                            initialUrl,
                                            verifyEmail,
                                          }) => {
  const [verifyState, setVerifyState] = useState('waiting');
  const [errorMessage, setErrorMessage] = useState('');

  const isVerifyingRef = useRef(false);
  const onVerifiedRef = useRef(onVerified);
  const verifyEmailRef = useRef(verifyEmail);

  // Keep refs in sync
  useEffect(() => { onVerifiedRef.current = onVerified; }, [onVerified]);
  useEffect(() => { verifyEmailRef.current = verifyEmail; }, [verifyEmail]);

  const [dotCount, setDotCount] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;




  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDotCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    return () => { clearInterval(dotsTimer); pulse.stop(); };
  }, [pulseAnim]);

  // ✅ SINGLE useEffect for URL handling — no duplicate listener
  useEffect(() => {
    // Small delay to let the app fully focus before processing
    const delayTimer = setTimeout(() => {
      if (initialUrl) {
        console.log('🔗 [PendingVerification] Processing initialUrl:', initialUrl);
        handleIncomingUrl(initialUrl);
      }
    }, 150);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 [PendingVerification] URL event (resume):', url);
      handleIncomingUrl(url);
    });

    return () => {
      clearTimeout(delayTimer);
      subscription.remove();
    };
  }, []); // ✅ empty deps — subscribe once on mount only

  const handleIncomingUrl = React.useCallback(async url => {
    if (!url) return;
    if (isVerifyingRef.current) return;

    console.log('🔗 [PendingVerification] Processing URL:', url);

    let accessToken = null;
    let tokenHash = null;
    let type = 'signup';

    // 1. Try hash fragment (#access_token=... — implicit flow fallback)
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const params = new URLSearchParams(url.substring(hashIndex + 1));
      accessToken = params.get('access_token');
    }

    // 2. Try query string (?token_hash=... — PKCE email confirmation)
    const questionIndex = url.indexOf('?');
    if (questionIndex !== -1) {
      const params = new URLSearchParams(url.substring(questionIndex + 1));
      if (!accessToken) {
        accessToken = params.get('access_token');
      }
      tokenHash = params.get('token_hash');
      type = params.get('type') || 'signup';
    }

    if (!accessToken && !tokenHash) {
      console.log('🔗 [PendingVerification] ❌ No access_token or token_hash found.');
      console.log('   Full URL received:', url);
      return;
    }

    isVerifyingRef.current = true;
    setVerifyState('verifying');

    try {
      // Pass whichever token we have — backend handles both
      const result = await verifyEmailRef.current(accessToken, tokenHash, type);

      if (result.success) {
        console.log('✅ [PendingVerification] SUCCESS! Username:', result.data.username);
        onVerifiedRef.current(result.data);
      } else {
        console.error('❌ [PendingVerification] Backend error:', result.error);
        setErrorMessage(result.error || 'Verification failed. Try again.');
        setVerifyState('error');
        isVerifyingRef.current = false;
      }
    } catch (err) {
      console.error('❌ [PendingVerification] Exception:', err);
      setErrorMessage('Something went wrong. Please try again.');
      setVerifyState('error');
      isVerifyingRef.current = false;
    }
  }, []);

  const handleRetry = () => {
    isVerifyingRef.current = false;
    setVerifyState('waiting');
    setErrorMessage('');
  };

  const handleManualRetry = async () => {
    isVerifyingRef.current = false;
    setVerifyState('waiting');
    setErrorMessage('');
    const url = await Linking.getInitialURL();
    if (url) {
      console.log('🔗 [PendingVerification] Manual retry — URL:', url);
      handleIncomingUrl(url);
    }
  };

  if (verifyState === 'verifying') return <VerifyingState />;
  if (verifyState === 'error') {
    return <ErrorState errorMessage={errorMessage} onRetry={handleRetry} onBack={onBack} />;
  }

  return (
    <WaitingState
      pendingEmail={pendingEmail}
      onBack={onBack}
      onManualRetry={handleManualRetry}
      pulseAnim={pulseAnim}
      dotCount={dotCount}
    />
  );
};
export default PendingVerificationScreen;
