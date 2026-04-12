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
      style={inputs.auth}
      autoCapitalize="none"
      autoCorrect={false}
    />

    <TextInput
      placeholder="Password"
      placeholderTextColor="#64748b"
      value={password}
      onChangeText={setPassword}
      style={inputs.auth}
      secureTextEntry
      autoCorrect={false}
    />

    {!isLogin && (
      <TextInput
        placeholder="Rider Type"
        placeholderTextColor="#64748b"
        value={riderType}
        onChangeText={setRiderType}
        style={inputs.auth}
      />
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
  const {saveAuth} = useAuth();

  const handleAuth = async () => {
    try {
      const result = isLogin
        ? await loginUser(username, password)
        : await registerUser(username, password, riderType);

      if (result.success) {
        // Backend returns accessToken (not token)
        const accessToken = result.data?.accessToken;
        if (accessToken) {
          await saveAuth(accessToken, username);
        }
        Alert.alert(isLogin ? 'Login Successful' : 'Registration Successful');
        if (isLogin && navigation) {
          navigation.navigate('RiderPage');
        }
      } else {
        Alert.alert('Error', result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Please try again later.');
    }
  };

  const toggleMode = () => setIsLogin(prev => !prev);

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
      />
    </View>
  );
};

export default AuthScreen;
