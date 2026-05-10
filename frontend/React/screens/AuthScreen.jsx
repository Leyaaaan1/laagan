import React, {useState} from 'react';
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
  evaluateRules,
  isFormValid,
  PASSWORD_RULES,
  USERNAME_RULES,
} from '../utilities/validator/Authvalidation';

const ValidationChecklist = ({rules, value, touched, isLogin}) => {
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
};

const getInputBorderStyle = (rules, value, touched, isLogin) => {
  if (isLogin || !touched || value.length === 0) return null;
  const {allPassed} = evaluateRules(rules, value);
  return allPassed ? authStyle.inputSuccess : authStyle.inputError;
};

const AuthForm = ({
  isLogin,
  username,
  password,
  confirmPassword,
  setUsername,
  setPassword,
  setConfirmPassword,
  handleAuth,
  toggleMode,
  touched,
  setTouched,
  loading,
  handleFacebookLogin,
}) => (
  <KeyboardAvoidingView
    style={layout.center}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Text
      style={[text.titleCenter, {marginBottom: spacing.lg, letterSpacing: 1}]}>
      {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
    </Text>

    <Text
      style={[text.bodyMuted, {textAlign: 'center', marginBottom: spacing.lg}]}>
      {isLogin
        ? 'Sign in to continue laags'
        : 'Join the community and start riding'}
    </Text>

    {/* ── Username ── */}
    <View style={authStyle.fieldBlock}>
      <TextInput
        placeholder="Username"
        placeholderTextColor="#64748b"
        value={username}
        onChangeText={setUsername}
        onFocus={() => setTouched(prev => ({...prev, username: true}))}
        style={[
          inputs.auth,
          getInputBorderStyle(
            USERNAME_RULES,
            username,
            touched.username,
            isLogin,
          ),
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={50}
        editable={!loading}
      />
      <ValidationChecklist
        rules={USERNAME_RULES}
        value={username}
        touched={touched.username}
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
          onFocus={() => setTouched(prev => ({...prev, confirmPassword: true}))}
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
        onPress={handleFacebookLogin} // ← was missing onPress
        disabled={loading}>
        <Text style={[text.white, {fontSize: 16}]}>Continue with Facebook</Text>
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
);

// ─────────────────────────────────────────────
// AuthScreen
// ─────────────────────────────────────────────
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    password: false,
    confirmPassword: false,
  });

  const {saveAuth} = useAuth();



  const handleAuth = async () => {
    setTouched({username: true, password: true, confirmPassword: true});

    if (!isFormValid(username, password, confirmPassword, isLogin)) {
      return;
    }

    setLoading(true);
    try {
      const result = isLogin
        ? await loginUser(username.trim(), password)
        : await registerUser(username.trim(), password);

      if (result.success) {
        const accessToken = result.data?.accessToken;
        const refreshToken = result.data?.refreshToken;

        if (accessToken && refreshToken) {
          // saveAuth sets auth.token → AppContent re-renders → AppStack mounts.
          // No manual navigation.navigate() needed — AuthScreen lives inside
          // AuthStack which has no RiderPage screen.
          await saveAuth(accessToken, refreshToken, username.trim());
        } else if (!isLogin) {
          // Registration succeeded but server didn't issue tokens (no auto-login).
          // Switch to login mode with the username pre-filled so the user
          // doesn't have to retype it.
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setTouched({
            username: false,
            password: false,
            confirmPassword: false,
          });
          Alert.alert(
            'Account Created',
            'You can now log in with your new account.',
          );
        }
      } else {
        const errorMessage =
          result.error ||
          (isLogin
            ? 'Invalid username or password.'
            : 'Registration failed. The username may already be taken.');
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithFacebook();
      if (result.success) {
        const {accessToken, refreshToken, username: fbUsername} = result.data;
        // ✅ Use the real username returned from the server, not a hardcoded string
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
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setTouched({username: false, password: false, confirmPassword: false});
  };

  return (
    <View
      style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <AuthForm
        isLogin={isLogin}
        username={username}
        password={password}
        confirmPassword={confirmPassword}
        setUsername={setUsername}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        handleAuth={handleAuth}
        toggleMode={toggleMode}
        touched={touched}
        setTouched={setTouched}
        loading={loading}
        handleFacebookLogin={handleFacebookLogin}
      />
    </View>
  );
};

export default AuthScreen;
