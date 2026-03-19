// ─────────────────────────────────────────────────────────────────────────────
// components/ride/RideCard.jsx
//
// Single shared card for both RidesList (RiderPage) and ProfileRidesList.
//
// variant="full"    — full card with map image, description, creator row
//                     used in RiderPage and UnifiedRides modal
// variant="compact" — stripped card without image/description
//                     used in ProfileRidesList (inside ScrollView)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideCard from '../../../styles/components/rideCard';
import badges from '../../../styles/base/badges';
import colors from '../../../styles/tokens/colors';

const getRideTypeIcon = (riderType) => {
  switch (riderType) {
    case 'car':         return 'car';
    case 'motor':
    case 'Motorcycle':  return 'motorcycle';
    case 'bike':
    case 'Bicycle':     return 'bicycle';
    case 'cafe Racers': return 'rocket';
    default:            return 'user';
  }
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const RideCard = ({ item, onPress, variant = 'full', showCreator = true }) => {
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(item)}
      style={[
        rideCard.container,
        isCompact && { marginBottom: 10 },
      ]}
    >
      {/* Location */}
      <Text style={rideCard.locationName} numberOfLines={1}>
        {item.locationName?.toUpperCase()}
      </Text>

      {/* ID + inactive badge */}
      <View style={rideCard.idRow}>
        <Text style={rideCard.idText}>ID: #{item.generatedRidesId}</Text>
        {item.active === false && (
          <View style={badges.inactive}>
            <Text style={badges.inactiveText}>INACTIVE</Text>
          </View>
        )}
      </View>

      {/* Ride name + type icon + distance */}
      <View style={rideCard.nameRow}>
        <Text style={rideCard.rideName} numberOfLines={1}>
          {item.ridesName}
        </Text>
        <View style={rideCard.typeRow}>
          <FontAwesome
            name={getRideTypeIcon(item.riderType)}
            size={isCompact ? 14 : 16}
            color={colors.primary}
            style={{ marginRight: 5 }}
          />
          <Text style={rideCard.distanceText}>{item.distance} km</Text>
        </View>
      </View>

      {/* Route: start → end */}
      <View style={rideCard.routeRow}>
        <FontAwesome name="map-marker" size={isCompact ? 13 : 14} color={colors.primary} />
        <Text style={[rideCard.routePointText, { flex: 1 }]} numberOfLines={1}>
          {item.startingPointName}
        </Text>
        <FontAwesome
          name="arrow-right"
          size={isCompact ? 11 : 12}
          color="#fff"
          style={{ marginHorizontal: isCompact ? 6 : 8 }}
        />
        <Text style={[rideCard.routePointText, { flex: 1 }]} numberOfLines={1}>
          {item.endingPointName}
        </Text>
      </View>

      {/* Date */}
      {item.date && (
        <Text style={rideCard.dateText}>
          <FontAwesome name="calendar" size={11} color="#aaa" />{' '}
          {formatDate(item.date)}
        </Text>
      )}

      {/* Creator — full variant only, and only when not viewing own rides */}
      {!isCompact && showCreator && item.username && (
        <View style={rideCard.creatorRow}>
          <FontAwesome name="user-circle" size={14} color="#666" />
          <Text style={rideCard.creatorText}>Created by {item.username}</Text>
        </View>
      )}

      {/* Map image — full variant only */}
      {!isCompact && item.mapImageUrl && (
        <Image
          source={{ uri: item.mapImageUrl }}
          style={rideCard.mapImage}
          resizeMode="cover"
        />
      )}

      {/* Description — full variant only */}
      {!isCompact && item.description && (
        <Text style={rideCard.description}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );
};

export default RideCard;