import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getRideDetails} from '../../services/rideService';
import colors from '../../styles/tokens/colors';
import {buildRideStep4Params} from '../../utilities/NavigationParamsBuilder';
import {useAuth} from '../../context/AuthContext';

const SearchHeader = ({navigation}) => {
  const {username} = useAuth();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const trimmed = searchId.trim();
    if (!trimmed) {
      setError('Please enter a ride ID');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError('');

    try {
      const ride = await getRideDetails(trimmed);
      const params = buildRideStep4Params(ride, username);
      setSearchId(''); // clear after success
      navigation.navigate('RideStep4', params);
    } catch (err) {
      setError(err?.message || 'Ride not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
        <View style={{position: 'relative'}}>
          <TextInput
            style={{
              width: 100,
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 5,
              padding: 8,
              paddingRight: 36,
              color: '#fff',
              fontSize: 14,
            }}
            placeholder="Ride ID"
            placeholderTextColor="#ccc"
            value={searchId}
            onChangeText={text => {
              setSearchId(text);
              if (error) setError(''); // clear error on new input
            }}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={handleSearch}
            disabled={loading}
            style={{
              position: 'absolute',
              right: 6,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 8,
            }}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="search" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {!!error && (
        <Text style={{color: '#ef4444', fontSize: 11, marginTop: 4}}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default SearchHeader;
