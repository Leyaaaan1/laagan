
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../styles/tokens/colors';
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

const OverlayStat = ({icon, value, unit, label}) => (
  <View style={rideDetailStyles.heroOverlayStat}>
    <FontAwesome
      name={icon}
      size={11}
      color={colors.tibetanRed200}
      style={rideDetailStyles.heroOverlayStatIcon}
    />
    <Text style={rideDetailStyles.heroOverlayStatValue}>
      {value}
      <Text style={rideDetailStyles.heroOverlayStatUnit}> {unit}</Text>
    </Text>
    <Text style={rideDetailStyles.heroOverlayStatLabel}>{label}</Text>
  </View>
);

const RideDetailHero = ({
  photo,
  rideName,
  distanceKm,
  durationMin,
  avgSpeedKph,
  onUpload,
}) => {
  const hasPhoto = !!photo?.imageUrl;
  const hours = Math.floor((durationMin ?? 0) / 60);
  const mins = (durationMin ?? 0) % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const HeroContent = () => (
    <View style={rideDetailStyles.heroInner}>
      {/* gradient sits on top of the image */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={rideDetailStyles.heroBottomOverlay}>
        <Text style={rideDetailStyles.heroRideName} numberOfLines={2}>
          {rideName ?? 'Unnamed Ride'}
        </Text>

        {/* inline stats strip */}
        <View style={rideDetailStyles.heroStatsStrip}>
          <OverlayStat
            icon="road"
            value={(distanceKm ?? 0).toFixed(1)}
            unit="km"
            label="Distance"
          />
          <View style={rideDetailStyles.heroStatDivider} />
          <OverlayStat
            icon="clock-o"
            value={durationStr}
            unit=""
            label="Duration"
          />
          <View style={rideDetailStyles.heroStatDivider} />
          <OverlayStat
            icon="tachometer"
            value={(avgSpeedKph ?? 0).toFixed(1)}
            unit="kph"
            label="Avg speed"
          />
        </View>
      </View>
    </View>
  );

  if (hasPhoto) {
    return (
      <ImageBackground
        source={{uri: photo.imageUrl}}
        style={rideDetailStyles.heroContainer}
        resizeMode="cover">
        <HeroContent />
      </ImageBackground>
    );
  }

  // No photo — plain dark hero so the overlay still looks intentional
  return (
    <View style={[rideDetailStyles.heroContainer, rideDetailStyles.heroDark]}>
      <HeroContent />
    </View>
  );
};

export default RideDetailHero;
