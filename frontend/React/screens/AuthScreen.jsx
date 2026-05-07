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
} from 'react-native';
import {loginUser, registerUser} from '../services/authService';
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

// ─────────────────────────────────────────────
// getInputBorderStyle
// Returns border override based on validation state.
// ─────────────────────────────────────────────
const getInputBorderStyle = (rules, value, touched, isLogin) => {
  if (isLogin || !touched || value.length === 0) return null;
  const {allPassed} = evaluateRules(rules, value);
  return allPassed ? authStyle.inputSuccess : authStyle.inputError;
};

// ─────────────────────────────────────────────
// AuthForm
// ─────────────────────────────────────────────
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
          ), //
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={50}
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
          ), //
        ]}
        secureTextEntry
        autoCorrect={false}
        maxLength={128}
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
      style={[buttons.pill, {width: 280, marginBottom: spacing.sm}]}
      onPress={handleAuth}>
      <Text style={[text.white, {fontSize: 16}]}>
        {isLogin ? 'Login' : 'Register'}
      </Text>
    </TouchableOpacity>

    {isLogin && (
      <TouchableOpacity
        style={[
          buttons.pill,
          {width: 280, marginBottom: spacing.sm, backgroundColor: '#1877F2'},
        ]}>
        <Text style={[text.white, {fontSize: 16}]}>Continue with Facebook</Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={[buttons.ghost, {marginTop: spacing.xs}]}
      onPress={toggleMode}>
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
const AuthScreen = ({navigation}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // touched tracks whether user has interacted with each field
  // validation checklist only appears after first focus
  const [touched, setTouched] = useState({
    username: false,
    password: false,
    confirmPassword: false,
  });

  const {saveAuth} = useAuth();

  const handleAuth = async () => {
    // Mark all fields as touched so errors show on submit attempt
    setTouched({username: true, password: true, confirmPassword: true});

    if (!isFormValid(username, password, confirmPassword, isLogin)) {
      return; // checklist already shows the issues inline
    }

    try {
      const result = isLogin
        ? await loginUser(username.trim(), password)
        : await registerUser(username.trim(), password);
      // ✅ riderType removed — set via profile edit after registration

      if (result.success) {
        const {accessToken, refreshToken} = result.data;

        if (accessToken && refreshToken) {
          await saveAuth(accessToken, refreshToken, username.trim());
        }

        if (isLogin) {
          Alert.alert('Welcome back!');
        }

        // ✅ small delay to ensure token is stored before RiderPage fetches
        setTimeout(() => {
          if (navigation) {
            navigation.navigate('RiderPage');
          }
        }, 300);
      } else {
        Alert.alert(
          'Error',
          isLogin
            ? 'Invalid username or password.'
            : 'Registration failed. The username may already be taken.',
        );
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Please try again later.');
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
      />
    </View>
  );
};

export default AuthScreen;