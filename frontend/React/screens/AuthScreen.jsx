import React, {useCallback, useState} from 'react';
import {View, StatusBar} from 'react-native';
import {useAuth} from '../context/AuthContext';
import layout from '../styles/base/layout';
import colors from '../styles/tokens/colors';

import {verifyEmail} from '../services/authService';
import {
  handleAuthFlow,
  handleFacebookAuthFlow,
  handleGoogleAuthFlow,
  handleVerificationSuccess,
  initializeAuthState,
  isLaunchedFromVerificationLink,
  resetAuthForm,
  toggleAuthMode,
} from './utilities/AuthScreenLogic';
import { PendingVerificationScreen} from './utilities/PendingVerificationScreen';
import {AuthForm} from './utilities/AuthScreenUi';


// ─────────────────────────────────────────────────────────────────────────────
// AuthScreen Main Component
// ─────────────────────────────────────────────────────────────────────────────
const AuthScreen = ({route}) => {
  const initialUrl = route?.params?.initialUrl ?? null;
  const launchedFromVerificationLink =
    isLaunchedFromVerificationLink(initialUrl);

  // Initialize all state at once
  const initialState = initializeAuthState(launchedFromVerificationLink);
  const [isLogin, setIsLogin] = useState(initialState.isLogin);
  const [email, setEmail] = useState(initialState.email);
  const [password, setPassword] = useState(initialState.password);
  const [confirmPassword, setConfirmPassword] = useState(
    initialState.confirmPassword,
  );
  const [loading, setLoading] = useState(initialState.loading);
  const [pendingVerification, setPendingVerification] = useState(
    initialState.pendingVerification,
  );
  const [pendingEmail, setPendingEmail] = useState(initialState.pendingEmail);
  const [touched, setTouched] = useState(initialState.touched);

  const {saveAuth} = useAuth();

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Verification Success
  // ──────────────────────────────────────────────────────────────────────────
  const handleVerified = useCallback(
    async authData => {
      await handleVerificationSuccess(authData, {
        saveAuth,
        setPendingVerification,
        setIsLogin,
      });
    },
    [saveAuth],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Back from Verification Screen
  // ──────────────────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    resetAuthForm({
      setEmail,
      setPassword,
      setConfirmPassword,
      setTouched,
      setIsLogin,
      setPendingVerification,
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Standard Login/Register
  // ──────────────────────────────────────────────────────────────────────────
  const handleAuth = useCallback(async () => {
    await handleAuthFlow(
      {
        email,
        password,
        confirmPassword,
        isLogin,
      },
      {
        saveAuth,
        setLoading,
        setPendingVerification,
        setPendingEmail,
        setIsLogin,
        setPassword,
        setConfirmPassword,
        setTouched,
      },
    );
  }, [email, password, confirmPassword, isLogin, saveAuth]);

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Google OAuth Login
  // ──────────────────────────────────────────────────────────────────────────
  const handleGoogleLogin = useCallback(async () => {
    await handleGoogleAuthFlow({saveAuth, setLoading});
  }, [saveAuth]);

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Facebook OAuth Login
  // ──────────────────────────────────────────────────────────────────────────
  const handleFacebookLogin = useCallback(async () => {
    await handleFacebookAuthFlow({saveAuth, setLoading});
  }, [saveAuth]);

  // ──────────────────────────────────────────────────────────────────────────
  // Handler: Toggle Login/Register Mode
  // ──────────────────────────────────────────────────────────────────────────
  const handleToggleMode = useCallback(() => {
    toggleAuthMode({
      setIsLogin,
      setEmail,
      setPassword,
      setConfirmPassword,
      setTouched,
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Pending Verification Screen
  // ──────────────────────────────────────────────────────────────────────────
  if (pendingVerification) {
    return (
      <PendingVerificationScreen
        pendingEmail={pendingEmail}
        onBack={handleBack}
        onVerified={handleVerified}
        initialUrl={initialUrl}
        verifyEmail={verifyEmail}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Render: Login/Register Screen
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View
      style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <AuthForm
        isLogin={isLogin}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        handleAuth={handleAuth}
        toggleMode={handleToggleMode}
        touched={touched}
        setTouched={setTouched}
        loading={loading}
        handleFacebookLogin={handleFacebookLogin}
        handleGoogleLogin={handleGoogleLogin}
      />
    </View>
  );
};

export default AuthScreen;
