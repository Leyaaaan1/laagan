import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideCard from '../../../styles/components/rideCard';
import colors from '../../../styles/tokens/colors';

const formatDate = date => {
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

const RideCard = ({item, onPress}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={() => onPress(item)}
    style={rideCard.container}>
    <Text style={rideCard.locationName} numberOfLines={1}>
      {item.ridesName}
    </Text>
    <Text style={rideCard.idText}>Rides ID: #{item.generatedRidesId}</Text>

    <Text style={rideCard.rideName}>{item.locationName}</Text>

    <View style={rideCard.routeRow}>
      <FontAwesome name="map-marker" size={14} color={colors.primary} />
      <Text style={[rideCard.routePointText, {flex: 1}]} numberOfLines={1}>
        {item.startingPointName}
      </Text>
    </View>

    {item.date && (
      <Text style={rideCard.dateText}>
        <FontAwesome name="calendar" size={11} color="#aaa" />{' '}
        {formatDate(item.date)}
      </Text>
    )}
  </TouchableOpacity>
);

export default RideCard;
