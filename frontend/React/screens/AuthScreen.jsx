import React, {useEffect, useState} from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser } from '../services/authService';
import { BASE_URL  } from '@env';
import inputs from '../styles/base/inputs';

const AuthForm = ({
                      isLogin,
                      username,
                      password,
                      riderType,
                      setUsername,
                      setPassword,
                      setRiderType,
                      handleAuth,
/*
                      handleFacebookLogin,
*/
                      toggleMode,
                      navigation,
                  }) => (


    <View style={inputs.authContainer}>
        <Text style={inputs.authTitle}>{isLogin ? 'Login' : 'Register'}</Text>

        <TextInput
            placeholder="Username"
            placeholderTextColor="#64748b"
            value={username}
            onChangeText={setUsername}
            style={inputs.authInput}
            autoCapitalize="none"
        />

        <TextInput
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            style={inputs.authInput}
            secureTextEntry
        />

        {!isLogin && (
            <TextInput
                placeholder="Rider Type"
                placeholderTextColor="#64748b"
                value={riderType}
                onChangeText={setRiderType}
                style={inputs.authInput}
            />
        )}

        <View style={inputs.authButtonsContainer}>
            <TouchableOpacity
                style={inputs.authButton}
                onPress={handleAuth}
            >
                <Text style={inputs.buttonText}>
                    {isLogin ? 'Login' : 'Register'}
                </Text>
            </TouchableOpacity>

            {/* Facebook Login Button - Only show on login */}
            {isLogin && (
                <TouchableOpacity
                    style={[inputs.authButton, { backgroundColor: '#1877F2' }]}
/*
                    onPress={handleFacebookLogin}
*/
                >
                    <Text style={inputs.buttonText}>
                        Continue with Facebook
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={inputs.authToggleButton}
                onPress={toggleMode}
            >
                <Text style={inputs.authToggleText}>
                    {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                </Text>
            </TouchableOpacity>
        </View>
    </View>
);
const AuthScreen = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('lean');
    const [password, setPassword] = useState('Lean');
    const [riderType, setRiderType] = useState('');


  useEffect(() => {
    const autoLogin = async () => {
      if (isLogin && username && password) {
        await handleAuth();
      }
    };
    autoLogin();
  }, []);

    const API_BASE_URL = BASE_URL;
    console.log(API_BASE_URL);
    // Regular username/password auth
    const handleAuth = async () => {
        try {
            const result = isLogin
                ? await loginUser(username, password)
                : await registerUser(username, password, riderType);

            if (result.success) {
                if (result.data.token) {
                    await AsyncStorage.setItem('userToken', result.data.token);
                    await AsyncStorage.setItem('username', username);
                }

                Alert.alert(isLogin ? 'Login Successful' : 'Registration Successful');

                if (isLogin && username) {
                    navigation.navigate('RiderPage', {
                        username: username,
                        token: result.data.token,
                    });
                }
                return true;
            } else {
                Alert.alert('Error', result.message || 'Operation failed');
                return false;
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Please try again later.');
            return false;
        }
    };

    const toggleMode = () => setIsLogin((prev) => !prev);

    return (
        <AuthForm
            isLogin={isLogin}
            username={username}
            password={password}
            riderType={riderType}
            setUsername={setUsername}
            setPassword={setPassword}
            setRiderType={setRiderType}
            handleAuth={handleAuth}
/*
            handleFacebookLogin={handleFacebookLogin}
*/
            toggleMode={toggleMode}
            navigation={navigation}
        />
    );
};

export default AuthScreen;
