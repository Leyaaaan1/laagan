import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import ridestep3style from '../../../styles/screens/ridestep3style';

/**
 * RouteTimeline
 *
 * Google Maps-style vertical timeline with nodes, connectors, and editable rows.
 * Renders start, stop, and end points with change / remove actions.
 */
const RouteTimeline = ({
  startingPoint,
  endingPoint,
  stopPoints,
  onChangeStart,
  onChangeEnd,
  onRemoveStop,
  mapMode,
}) => {
  const renderNode = (type, index) => {
    switch (type) {
      case 'start':
        return <View style={ridestep3style.nodeStart} />;
      case 'end':
        return <View style={ridestep3style.nodeEnd} />;
      case 'stop':
        return (
          <View style={ridestep3style.nodeStop}>
            <Text style={ridestep3style.nodeLabel}>{index + 1}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={ridestep3style.timelineWrapper}>
      {/* Vertical timeline line (background) */}
      <View style={ridestep3style.timelineLine} />

      {/* START ROW */}
      <View
        style={[
          ridestep3style.routeRow,
          mapMode === 'starting' && {
            borderWidth: 1.5,
            borderColor: '#8c2323',
            borderRadius: 10,
          },
        ]}>
        <View style={ridestep3style.timelineLeft}>
          {renderNode('start', 0)}
        </View>
        <View style={ridestep3style.routeRowContentWrapper}>
          <Text style={ridestep3style.rowLabel}>Start</Text>
          <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
            {startingPoint || 'Not set'}
          </Text>
        </View>
        <TouchableOpacity
          style={ridestep3style.rowChangeBtn}
          onPress={onChangeStart}>
          <Text style={ridestep3style.rowChangeBtnText}>
            {startingPoint ? 'Change' : 'Set'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* STOP ROWS */}
      {stopPoints.length > 0 &&
        stopPoints.map((stop, index) => (
          <View key={`stop-${index}`} style={ridestep3style.routeRow}>
            <View style={ridestep3style.timelineLeft}>
              {renderNode('stop', index)}
            </View>
            <View style={ridestep3style.routeRowContentWrapper}>
              <Text style={ridestep3style.rowLabel}>Stop {index + 1}</Text>
              <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
                {stop.name}
              </Text>
            </View>
            <TouchableOpacity
              style={ridestep3style.rowRemoveBtn}
              onPress={() => onRemoveStop(index)}>
              <FontAwesome name="times" size={16} color="#8c2323" />
            </TouchableOpacity>
          </View>
        ))}

      {/* END ROW */}
      <View
        style={[
          ridestep3style.routeRow,
          mapMode === 'ending' && {
            borderWidth: 1.5,
            borderColor: '#8c2323',
            borderRadius: 10,
          },
        ]}>
        <View style={ridestep3style.timelineLeft}>{renderNode('end', 0)}</View>
        <View style={ridestep3style.routeRowContentWrapper}>
          <Text style={ridestep3style.rowLabel}>End</Text>
          <Text style={ridestep3style.rowLocationName} numberOfLines={2}>
            {endingPoint || 'Not set'}
          </Text>
        </View>
        <TouchableOpacity
          style={ridestep3style.rowChangeBtn}
          onPress={onChangeEnd}>
          <Text style={ridestep3style.rowChangeBtnText}>
            {endingPoint ? 'Change' : 'Set'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RouteTimeline;
