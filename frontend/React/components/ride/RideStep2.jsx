// React/components/ride/RideStep2.jsx
import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    Image,
    StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import getMapHTML from '../../utilities/mapHTML';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {getLocationImage} from '../../services/rideService';
import feedback from '../../styles/base/feedback';
import images from '../../styles/base/images';
import header from '../../styles/base/header';
import buttons from '../../styles/base/buttons';
import rideCreation from '../../styles/screens/rideCreation';
import inputs from '../../styles/base/inputs';
import layout from '../../styles/base/layout';



const RideStep2 = ({
                       isSearching, searchResults, searchQuery, setSearchQuery,
                       handleLocationSelect, webViewRef, latitude, longitude,
                       handleMessage, locationName,
                       prevStep, nextStep, handleSearchInputChange, token,
                   }) => {

    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [rideNameImage, setRideNameImage] = useState([]);
    const [rideNameImageLoading, setRideNameImageLoading] = useState(false);
    const [rideNameImageError, setRideNameImageError] = useState(null);

  const fetchLocationImages = useCallback(async (locationName) => {
          setRideNameImageLoading(true);
          setRideNameImageError(null);
          try {
            const images = await getLocationImage(locationName, token);
            setRideNameImage(images);
          } catch (error) {
            setRideNameImageError(error.message);
            setRideNameImage([]);
          } finally {
            setRideNameImageLoading(false);
          }
        }, [token]);

        useEffect(() => {
          if (locationName && locationName.trim()) {
            fetchLocationImages(locationName);
          } else {
            setRideNameImage([]);
          }
        }, [locationName, fetchLocationImages]);


    useEffect(() => {
      if (locationName && locationName.trim()) {
        fetchLocationImages(locationName);
      } else {
        setRideNameImage([]);
      }
    }, [locationName, fetchLocationImages]);

    return (
        <View style={layout.screen}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Half-screen Map */}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%', // Changed to 50% height
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                overflow: 'hidden',
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            }}>
                <WebView
                    ref={webViewRef}
                    source={{ html: getMapHTML(latitude, longitude) }}
                    style={{ flex: 1 }}
                    onMessage={handleMessage}
                    javaScriptEnabled={true}
                />
            </View>

            {/* Images Section - Positioned below map */}
            <View style={{
                position: 'absolute',
                top: '52%', // Position below map with small gap
                left: 12,
                right: 12,
                height: '30%', // Adjust height as needed
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            }}>
              {rideNameImageLoading ? (
                <View style={feedback.loadingContainer}>
                  <ActivityIndicator size="large" color="#8c2323" />
                  <Text style={feedback.loadingText}>Loading location images...</Text>
                </View>
              ) : Array.isArray(rideNameImage) && rideNameImage.length > 0 ? (
                <FlatList
                  data={rideNameImage}
                  horizontal
                  pagingEnabled
                  keyExtractor={(_, idx) => idx.toString()}
                  renderItem={({ item }) => (
                    <View style={[images.locationImageContainer, { margin: 8 }]}>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={[images.locationImage, { borderRadius: 16 }]}
                      />
                      {(item.author || item.license) && (
                        <View style={[images.metaOverlay, { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}>
                          <Text style={images.metaText}>
                            {item.author ? `Photo: ${item.author}` : ''}
                            {item.author && item.license ? ' | ' : ''}
                            {item.license ? `License: ${item.license}` : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={feedback.errorContainer}>
                  <Text style={feedback.errorText}>
                    {rideNameImageError || 'No location images available'}
                  </Text>
                </View>
              )}
            </View>
          {/* Modern Floating Navbar - Kept at top */}
            <View style={header.bar}>
                <TouchableOpacity
                    style={buttons.navButton}
                    onPress={prevStep}
                >
                    <FontAwesome name="arrow-left" size={16} color="#5f6368" style={{ marginRight: 6 }} />
                    <Text style={buttons.textDark}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[rideCreation.navButtonBack, rideCreation.navButtonNext]}
                    onPress={nextStep}
                >
                  <Text style={buttons.textPrimary}>Next</Text>
                    <FontAwesome name="arrow-right" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
            </View>

            {/* Modern Search Card - Positioned below navbar */}
          <View style={[rideCreation.searchContainer, { top: 90 }]}>
            <View style={[
              inputs.searchRow,
              isSearchFocused && inputs.searchRowFocused,
            ]}>
              <FontAwesome name="search" size={16} color="#5f6368" style={{ marginRight: 12 }} />
              <TextInput
                style={inputs.location}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                placeholder="Where do you want to ride?"
                placeholderTextColor="#9aa0a6"
                returnKeyType="search"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onSubmitEditing={() => handleSearchInputChange(searchQuery)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={{ padding: 4, marginRight: 8 }}
                >
                  <FontAwesome name="times-circle" size={16} color="#9aa0a6" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            {isSearching && (
              <View style={[feedback.loadingRow, { marginTop: 16 }]}>
                <ActivityIndicator size="small" color="#8c2323" />
                <Text style={feedback.loadingText}>Finding locations...</Text>
              </View>
            )}

            {searchResults.length > 0 && (
              <ScrollView
                style={[inputs.resultsList, { maxHeight: 200 }]}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={item.place_id.toString()}
                    style={[
                      inputs.resultItem,
                      index === searchResults.length - 1 && inputs.resultItemLast,
                    ]}
                    onPress={() => { handleLocationSelect(item); }}
                  >
                    <View style={{ width: 20, height: 36, justifyContent: 'center', alignItems: 'center' }}>
                      <FontAwesome name="map-marker" size={16} color="#8c2323" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={inputs.resultName}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={inputs.resultAddress}>
                        {item.display_name}
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={14} color="#dadce0" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Selected Location Card */}
          {locationName && locationName.trim() && (
            <View style={[rideCreation.locationInfoCard, { bottom: 32 }]}>
              <Text style={rideCreation.locationName}>{locationName}</Text>
              <TouchableOpacity
                style={[buttons.primary, { marginTop: 16 }]}
                onPress={nextStep}
              >
                <Text style={buttons.textPrimary}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
    );};

export default RideStep2;
