// HomeScreen.jsx
import React from 'react';
import { SafeAreaView, Text, View, TouchableOpacity } from 'react-native';
import text from '../styles/base/text';
import buttons from '../styles/base/buttons';
import layout from '../styles/base/layout';

const HomeScreen = ({ navigation }) => {
    return (
      <SafeAreaView style={layout.screen}>
            {/* Top Navbar */}
            <View>
                <Text style={text.navbarTextDark}>Riders</Text>
            </View>



            {/* Bottom Home Button */}
            <View style={buttons.primary}>
              <TouchableOpacity style={buttons.primary}>
                    <Text style={buttons.textPrimary}>Home</Text>
                </TouchableOpacity>
            </View>

            <View>
                <TouchableOpacity
                    style={buttons.primary}
                    onPress={() => navigation.navigate('AuthScreen')}
                >
                    <Text style={buttons.textPrimary}>Login</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;
