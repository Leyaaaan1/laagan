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
import colors from '../styles/tokens/colors';
import spacing from '../styles/tokens/spacing';
import {useAuth} from '../context/AuthContext';


const validateInputs = (isLogin, username, password, riderType) => {
  const errors = {};

  if (!username || username.trim().length === 0) {
    errors.username = 'Username is required';
  } else if (username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (username.trim().length > 50) {
    errors.username = 'Username must be under 50 characters';
  } else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
    errors.username = 'Username can only contain letters, numbers, _ . -';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password.length > 128) {
    errors.password = 'Password is too long';
  }

  if (!isLogin) {
    if (!riderType || riderType.trim().length === 0) {
      errors.riderType = 'Rider type is required';
    }
  }

  return errors;
};


const AuthForm = ({
                    isLogin,
                    username,
                    password,
                    riderType,
                    setUsername,
                    setPassword,
                    setRiderType,
                    handleAuth,
                    toggleMode,
                    fieldErrors,  // ADDED
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

    <TextInput
      placeholder="Username"
      placeholderTextColor="#64748b"
      value={username}
      onChangeText={setUsername}
      style={[
        inputs.auth,
        // ADDED: highlight field red if validation error exists
        fieldErrors.username ? {borderColor: '#ef4444'} : null,
      ]}
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={50}  // ADDED: enforce max length at input level
    />
    {/* ADDED: inline error message */}
    {fieldErrors.username ? (
      <Text style={{color: '#ef4444', fontSize: 12, marginBottom: 4, alignSelf: 'flex-start'}}>
        {fieldErrors.username}
      </Text>
    ) : null}

    <TextInput
      placeholder="Password"
      placeholderTextColor="#64748b"
      value={password}
      onChangeText={setPassword}
      style={[
        inputs.auth,
        fieldErrors.password ? {borderColor: '#ef4444'} : null,
      ]}
      secureTextEntry
      autoCorrect={false}
      maxLength={128}  // ADDED
    />
    {fieldErrors.password ? (
      <Text style={{color: '#ef4444', fontSize: 12, marginBottom: 4, alignSelf: 'flex-start'}}>
        {fieldErrors.password}
      </Text>
    ) : null}

    {!isLogin && (
      <>
        <TextInput
          placeholder="Rider Type"
          placeholderTextColor="#64748b"
          value={riderType}
          onChangeText={setRiderType}
          style={[
            inputs.auth,
            fieldErrors.riderType ? {borderColor: '#ef4444'} : null,
          ]}
        />
        {fieldErrors.riderType ? (
          <Text style={{color: '#ef4444', fontSize: 12, marginBottom: 4, alignSelf: 'flex-start'}}>
            {fieldErrors.riderType}
          </Text>
        ) : null}
      </>
    )}

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

const AuthScreen = ({navigation}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [riderType, setRiderType] = useState('');
  // ADDED: validation error state
  const [fieldErrors, setFieldErrors] = useState({});
  const {saveAuth} = useAuth();

  const handleAuth = async () => {

    const errors = validateInputs(isLogin, username, password, riderType);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      const result = isLogin
        ? await loginUser(username.trim(), password)
        : await registerUser(username.trim(), password, riderType.trim());

      if (result.success) {
        const accessToken = result.data?.accessToken;
        const refreshToken = result.data?.refreshToken;
        if (accessToken && refreshToken) {
          await saveAuth(accessToken, refreshToken, username.trim());
        }
        // CHANGED: More specific success messages, and clear form fields on success
        Alert.alert(
          isLogin ? 'Login Successful' : 'Registration Successful',
          isLogin ? 'Welcome back!' : 'Account created. You can now log in.',
        );
        if (isLogin && navigation) {
          navigation.navigate('RiderPage');
        }
      } else {
        // CHANGED: Show a generic error message rather than the raw backend
        // message, which may reveal internal details (table names, field names, etc.)
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
    setFieldErrors({}); // ADDED: clear errors when switching between login/register
  };

  return (
    <View
      style={[layout.screen, {alignItems: 'center', justifyContent: 'center'}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.black} />
      <AuthForm
        isLogin={isLogin}
        username={username}
        password={password}
        riderType={riderType}
        setUsername={setUsername}
        setPassword={setPassword}
        setRiderType={setRiderType}
        handleAuth={handleAuth}
        toggleMode={toggleMode}
        fieldErrors={fieldErrors}  // ADDED
      />
    </View>
  );
};

export default AuthScreen;