import {
  loginUser,
  loginWithFacebook,
  loginWithGoogle,
  registerUser,
  verifyEmail,
} from '../../services/authService';
import {isFormValid} from '../../utilities/validator/Authvalidation';
import {Alert} from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Auth Logic Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** * Handle traditional login/register flow */
export const handleAuthFlow = async (
  {email, password, confirmPassword, isLogin},
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
) => {
  setTouched({email: true, password: true, confirmPassword: true});

  if (!isFormValid(email, password, confirmPassword, isLogin)) {
    return;
  }

  setLoading(true);
  try {
    const result = isLogin
      ? await loginUser(email.trim(), password)
      : await registerUser(email.trim(), password);

    if (result.success) {
      if (result.pendingVerification) {
        setPendingEmail(email.trim());
        setPendingVerification(true);
        return;
      }

      const {accessToken, refreshToken, username} = result.data;
      if (accessToken && refreshToken) {
        await saveAuth(accessToken, refreshToken, username ?? email.trim());
      } else if (!isLogin) {
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setTouched({email: false, password: false, confirmPassword: false});
        Alert.alert(
          'Account Created',
          'You can now log in with your new account.',
        );
      }
    } else {
      const errorMessage =
        result.error ||
        (isLogin
          ? 'Invalid email or password.'
          : 'Registration failed. This email may already be registered.');
      Alert.alert('Error', errorMessage);
    }
  } catch (error) {
    console.error('Auth error:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
};

/** * Handle Google OAuth login */
export const handleGoogleAuthFlow = async ({saveAuth, setLoading}) => {
  setLoading(true);
  try {
    const result = await loginWithGoogle();
    if (result.success) {
      const {accessToken, refreshToken, username} = result.data;
      await saveAuth(accessToken, refreshToken, username ?? 'google_user');
    } else {
      Alert.alert('Error', result.error);
    }
  } catch (error) {
    Alert.alert('Error', 'Google login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

/** * Handle Facebook OAuth login */
export const handleFacebookAuthFlow = async ({saveAuth, setLoading}) => {
  setLoading(true);
  try {
    const result = await loginWithFacebook();
    if (result.success) {
      const {accessToken, refreshToken, username: fbUsername} = result.data;
      await saveAuth(accessToken, refreshToken, fbUsername ?? 'facebook_user');
    } else {
      Alert.alert('Error', result.error);
    }
  } catch (error) {
    Alert.alert('Error', 'Facebook login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};


/** * Handle successful email verification */
export const handleVerificationSuccess = async (
  {accessToken, refreshToken, username},
  {saveAuth, setPendingVerification, setIsLogin},
) => {
  try {
    await saveAuth(accessToken, refreshToken, username);
    console.log('✅ [AuthScreen] Logged in after verification:', username);
    // ✅ FIX: Clear verification state so app navigates to RiderPage
    setPendingVerification(false);
  } catch (err) {
    console.error('❌ [AuthScreen] saveAuth failed after verify:', err);
    Alert.alert(
      'Error',
      'Could not complete login. Please try logging in manually.',
    );
    setPendingVerification(false);
    setIsLogin(true);
  }
};

/** * Reset auth form to initial state */
export const resetAuthForm = ({
  setEmail,
  setPassword,
  setConfirmPassword,
  setTouched,
  setIsLogin,
  setPendingVerification,
}) => {
  setPendingVerification(false);
  setIsLogin(true);
  setEmail('');
  setPassword('');
  setConfirmPassword('');
  setTouched({email: false, password: false, confirmPassword: false});
};

/** * Toggle between login and register modes */
export const toggleAuthMode = ({
  setIsLogin,
  setEmail,
  setPassword,
  setConfirmPassword,
  setTouched,
}) => {
  setIsLogin(prev => !prev);
  setEmail('');
  setPassword('');
  setConfirmPassword('');
  setTouched({email: false, password: false, confirmPassword: false});
};

/** * Check if app was launched from verification link */
export const isLaunchedFromVerificationLink = initialUrl => {
  return (
    initialUrl != null &&
    (initialUrl.includes('access_token') || initialUrl.includes('verify'))
  );
};

/** * Initialize auth state objects */
export const initializeAuthState = launchedFromVerificationLink => ({
  isLogin: true,
  email: '',
  password: '',
  confirmPassword: '',
  loading: false,
  pendingVerification: launchedFromVerificationLink,
  pendingEmail: '',
  touched: {
    email: false,
    password: false,
    confirmPassword: false,
  },
});
