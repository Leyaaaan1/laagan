import {ScrollView, Text, View} from 'react-native';
import cards from '../../../styles/base/cards';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {formatDate, getLocationDisplayName} from './RideStepUtils';
import spacing from '../../../styles/tokens/spacing';
import React from 'react';

export const renderRideHeroCard = ({
  rideName,
  date,
  username,
  riderType,
  distance,
  description,
  rideDetailsWithCoords,
  startingPointName,
  endingPointName,
}) => {
  const displayDistance = distance || rideDetailsWithCoords?.distance || '--';
  const displayStarting =
    rideDetailsWithCoords?.startingPointName || startingPointName;
  const displayEnding =
    rideDetailsWithCoords?.endingPointName || endingPointName;

  return (
    <View style={cards.heroGlass}>
      <View style={cards.heroDistanceBadge}>
        <FontAwesome name="motorcycle" size={14} color="#8c2323" />
        <Text style={cards.heroDistanceText}>{displayDistance} km</Text>
      </View>

      <Text style={cards.heroTitle}>{rideName}</Text>

      <View style={cards.heroChipsRow}>
        <View style={cards.heroChip}>
          <FontAwesome name="calendar" size={12} color="#8888" />
          <Text style={cards.heroChipText}>{formatDate(date)}</Text>
        </View>
        <View style={cards.heroChip}>
          <FontAwesome name="user-circle" size={12} color="#888888" />
          <Text style={cards.heroChipText}>
            {(username || '').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={cards.routeContainer}>
        <View style={cards.routePoint}>
          <View style={cards.routePointStart}>
            <FontAwesome name="circle" size={14} color="#10b981" />
          </View>
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <Text style={cards.routePointLabel}>From</Text>
            <Text
              style={cards.routePointTextLarge}
              numberOfLines={2}
              ellipsizeMode="tail">
              {getLocationDisplayName(displayStarting)}
            </Text>
          </View>
        </View>

        <View style={cards.routeDottedConnector}>
          <View style={cards.routeDot} />
          <View style={cards.routeDot} />
          <View style={cards.routeDot} />
          <View style={cards.routeDot} />
          <View style={cards.routeDot} />
        </View>

        <View style={cards.routePoint}>
          <View style={cards.routePointEnd}>
            <FontAwesome name="circle" size={14} color="#ef4444" />
          </View>
          <View style={{flex: 1, marginLeft: spacing.md}}>
            <Text style={cards.routePointLabel}>To</Text>
            <Text
              style={cards.routePointTextLarge}
              numberOfLines={2}
              ellipsizeMode="tail">
              {getLocationDisplayName(displayEnding)}
            </Text>
          </View>
        </View>
      </View>

      {description && (
        <View style={cards.descriptionContainer}>
          <Text style={cards.descriptionLabel}>Details</Text>
          <ScrollView
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            style={cards.descriptionBox}>
            <Text style={cards.descriptionText}>{description}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const RideHeroCard = props => {
  return renderRideHeroCard(props);
};

export default RideHeroCard;
