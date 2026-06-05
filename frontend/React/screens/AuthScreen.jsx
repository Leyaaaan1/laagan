import React, {useCallback, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {
  loginUser,
  loginWithFacebook,
  loginWithGoogle,
  registerUser,
} from '../services/authService';
import inputs from '../styles/base/inputs';
import buttons from '../styles/base/buttons';
import text from '../styles/base/text';
import layout from '../styles/base/layout';
import authStyle from '../styles/screens/authStyles';
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';
import {useAuth} from '../context/AuthContext';
import {
  CONFIRM_RULES,
  EMAIL_RULES,
  evaluateRules,
  isFormValid,
  PASSWORD_RULES,
} from '../utilities/validator/Authvalidation';
import {createMemoCompare} from '../utilities/propsComparison';

// ─────────────────────────────────────────────────────────────────────────────
// ValidationChecklist
// ─────────────────────────────────────────────────────────────────────────────
const ValidationChecklist = React.memo(({rules, value, touched, isLogin}) => {
  if (isLogin || !touched || value.length === 0) return null;

  const {rules: evaluated} = evaluateRules(rules, value);

  return (
    <View style={authStyle.container}>
      {evaluated.map(rule => {
        const isPending = value.length === 0;
        const dotStyle = isPending
          ? authStyle.dotPending
          : rule.passed
          ? authStyle.dotPassed
          : authStyle.dotFailed;
        const labelStyle = isPending
          ? authStyle.ruleTextPending
          : rule.passed
          ? authStyle.ruleTextPassed
          : authStyle.ruleTextFailed;

        return (
          <View key={rule.key} style={authStyle.ruleRow}>
            <View style={[authStyle.dot, dotStyle]} />
            <Text style={[authStyle.ruleText, labelStyle]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
});

const getInputBorderStyle = (rules, value, touched, isLogin) => {
  if (isLogin || !touched || value.length === 0) return null;
  const {allPassed} = evaluateRules(rules, value);
  return allPassed ? authStyle.inputSuccess : authStyle.inputError;
};

// ─────────────────────────────────────────────────────────────────────────────
// AuthForm
// ─────────────────────────────────────────────────────────────────────────────
const AuthForm = React.memo(
  ({
    isLogin,
    email,
    password,
    confirmPassword,
    setEmail,
    setPassword,
    setConfirmPassword,
    handleAuth,
    toggleMode,
    touched,
    setTouched,
    loading,
    handleFacebookLogin,
    handleGoogleLogin,
  }) => (
    <KeyboardAvoidingView
      style={layout.center}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text
        style={[
          text.titleCenter,
          {marginBottom: spacing.lg, letterSpacing: 1},
        ]}>
        {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
      </Text>

      <Text
        style={[
          text.bodyMuted,
          {textAlign: 'center', marginBottom: spacing.lg},
        ]}>
        {isLogin
          ? 'Sign in to continue laags'
          : 'Join the community and start riding'}
      </Text>

      {/* ── Email ── */}
      <View style={authStyle.fieldBlock}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setTouched(prev => ({...prev, email: true}))}
          style={[
            inputs.auth,
            getInputBorderStyle(EMAIL_RULES, email, touched.email, isLogin),
          ]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={254}
          editable={!loading}
        />
        <ValidationChecklist
          rules={EMAIL_RULES}
          value={email}
          touched={touched.email}
          isLogin={isLogin}
        />
      </View>

      {/* ── Password ── */}
      <View style={authStyle.fieldBlock}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          onFocus={() => setTouched(prev => ({...prev, password: true}))}
          style={[
            inputs.auth,
            getInputBorderStyle(
              PASSWORD_RULES,
              password,
              touched.password,
              isLogin,
            ),
          ]}
          secureTextEntry
          autoCorrect={false}
          maxLength={128}
          editable={!loading}
        />
        <ValidationChecklist
          rules={PASSWORD_RULES}
          value={password}
          touched={touched.password}
          isLogin={isLogin}
        />
      </View>

      {/* ── Confirm Password (register only) ── */}
      {!isLogin && (
        <View style={authStyle.fieldBlock}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#64748b"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() =>
              setTouched(prev => ({...prev, confirmPassword: true}))
            }
            style={[
              inputs.auth,
              getInputBorderStyle(
                CONFIRM_RULES(password),
                confirmPassword,
                touched.confirmPassword,
              ),
            ]}
            secureTextEntry
            autoCorrect={false}
            maxLength={128}
            editable={!loading}
          />
          <ValidationChecklist
            rules={CONFIRM_RULES(password)}
            value={confirmPassword}
            touched={touched.confirmPassword}
          />
        </View>
      )}

      {/* ── Submit ── */}
      <TouchableOpacity
        style={[
          buttons.pill,
          {width: 280, marginBottom: spacing.sm, opacity: loading ? 0.7 : 1},
        ]}
        onPress={handleAuth}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[text.white, {fontSize: 16}]}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        )}
      </TouchableOpacity>

      {isLogin && (
        <TouchableOpacity
          style={[
            buttons.pill,
            {width: 280, marginBottom: spacing.sm, backgroundColor: '#1877F2'},
          ]}
          onPress={handleFacebookLogin}
          disabled={loading}>
          <Text style={[text.white, {fontSize: 16}]}>
            Continue with Facebook
          </Text>
        </TouchableOpacity>
      )}

      {isLogin && (
        <TouchableOpacity
          style={[
            buttons.pill,
            {width: 280, marginBottom: spacing.sm, backgroundColor: '#4285F4'},
          ]}
          onPress={handleGoogleLogin}
          disabled={loading}>
          <Text style={[text.white, {fontSize: 16}]}>Continue with Google</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[buttons.ghost, {marginTop: spacing.xs}]}
        onPress={toggleMode}
        disabled={loading}>
        <Text style={text.muted}>
          {isLogin
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  ),
  createMemoCompare([
    'setEmail',
    'setPassword',
    'setConfirmPassword',
    'setTouched',
    'handleAuth',
    'toggleMode',
    'handleFacebookLogin',
    'handleGoogleLogin',
  ]),
);

// ─────────────────────────────────────────────────────────────────────────────
// AuthScreen
// ─────────────────────────────────────────────────────────────────────────────
const AuthScreen = ({navigation}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const {saveAuth} = useAuth();

  const handleAuth = useCallback(async () => {
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
        const {accessToken, refreshToken, username} = result.data;

        if (accessToken && refreshToken) {
          await saveAuth(
            accessToken,
            refreshToken,
            username ?? email.trim(),
            result.data.onboardingCompleted ?? false,  // ← pass it
          );
        } else if (!isLogin) {
          // 📧 Registration successful but email not verified
          Alert.alert(
            '✅ Account Created',
            'Check your email to verify your account.',
            [{text: 'OK'}],
          );
          // ✅ Navigate to email verification screen
          navigation.replace('EmailVerification', {email: email.trim()});
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
  }, [email, password, confirmPassword, isLogin, saveAuth, navigation]);

  const handleGoogleLogin = useCallback(async () => {
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
  }, [saveAuth]);

  const handleFacebookLogin = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loginWithFacebook();
      if (result.success) {
        const {accessToken, refreshToken, username: fbUsername} = result.data;
        await saveAuth(
          accessToken,
          refreshToken,
          fbUsername ?? 'facebook_user',
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Facebook login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const toggleMode = useCallback(() => {
    setIsLogin(prev => !prev);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTouched({email: false, password: false, confirmPassword: false});
  }, []);

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
        toggleMode={toggleMode}
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
