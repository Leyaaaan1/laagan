import React from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideStep4Styles from '../../../styles/screens/rideStep4';

import {RIDE_STATUS} from '../hooks/useRideStatus';
import buttons from '../../../styles/base/buttons';
import header from '../../../styles/base/header';
import colors from '../../../styles/tokens/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Navbar action button  (top-right of the header)
// ─────────────────────────────────────────────────────────────────────────────

export const RideActionButton = ({
  isOwner,
  hasJoined,
  hasPendingRequest,
  rideStatus,
  onJoin,
  onStart,
  onViewStarted,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={[rideStep4Styles.joinButton, {opacity: 0.6}]}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  const isStarted = rideStatus === RIDE_STATUS.ACTIVE;
  const isPersonalFinished = rideStatus === RIDE_STATUS.PERSONAL_FINISHED;
  const isFinished =
    rideStatus === RIDE_STATUS.FINISHED || rideStatus === RIDE_STATUS.STOPPED;

  // ── Owner ──────────────────────────────────────────────────────────────────
  if (isOwner) {
    // Ride active or participant finished their leg → View
    if (isStarted || isPersonalFinished) {
      return (
        <TouchableOpacity
          style={rideStep4Styles.startButton}
          onPress={onViewStarted}>
          <FontAwesome
            name="map-marker"
            size={14}
            color="#fff"
            style={{marginRight: 6}}
          />
          <Text style={rideStep4Styles.joinButtonText}>View</Text>
        </TouchableOpacity>
      );
    }

    // Finished / Stopped → reset to Play so owner can start a new session
    if (isFinished) {
      return (
        <TouchableOpacity style={rideStep4Styles.startButton} onPress={onStart}>
          <FontAwesome name="play" size={16} color="#fff" />
        </TouchableOpacity>
      );
    }

    // NOT_STARTED → Start
    return (
      <TouchableOpacity style={rideStep4Styles.startButton} onPress={onStart}>
        <FontAwesome name="play" size={16} color="#fff" />
      </TouchableOpacity>
    );
  }

  // ── Participant ────────────────────────────────────────────────────────────

  // Ride is ACTIVE and user is confirmed in participants → View
  if (isStarted && hasJoined) {
    return (
      <TouchableOpacity
        style={[rideStep4Styles.joinButton, {backgroundColor: colors.primary}]}
        onPress={onViewStarted}>
        <FontAwesome
          name="map-marker"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>View</Text>
      </TouchableOpacity>
    );
  }  // Already in participants but ride not started yet → show nothing
  if (hasJoined) {
    return null;
  }

  // Join request sent but not yet accepted → dimmed disabled button
  // Remove this block entirely if pending request tracking is not implemented
  if (hasPendingRequest) {
    return (
      <TouchableOpacity
        style={[rideStep4Styles.joinButton, {opacity: 0.45}]}
        disabled>
        <FontAwesome
          name="plus"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>Join Ride</Text>
      </TouchableOpacity>
    );
  }

  // Not in participants, no pending request → Join Ride
  return (
    <TouchableOpacity style={rideStep4Styles.joinButton} onPress={onJoin}>
      <FontAwesome
        name="plus"
        size={14}
        color="#fff"
        style={{marginRight: 6}}
      />
      <Text style={rideStep4Styles.joinButtonText}>Join Ride</Text>
    </TouchableOpacity>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// Bottom action bar (center button between Riders ↔ Stop Points)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Center button states:
 *  - "View Summary"          → ride is FINISHED (owner ended it)
 *  - "View Personal Summary" → participant finished their leg (PERSONAL_FINISHED)
 *                              while main ride is still ACTIVE
 *  - "View Checkpoints"      → ride is ACTIVE
 *  (hidden when NOT_STARTED)
 */
export const RideStatusCenterButton = ({rideStatus, onPress}) => {

  if (rideStatus === RIDE_STATUS.NOT_STARTED) return null;

  let icon, label;

  switch (rideStatus) {
    case RIDE_STATUS.FINISHED:
      icon = 'flag-checkered';
      label = 'View Summary';
      break;
    case RIDE_STATUS.PERSONAL_FINISHED:
      icon = 'user';
      label = 'Personal Summary';
      break;
    case RIDE_STATUS.ACTIVE:
    default:
      icon = 'map-pin';
      label = 'Checkpoints';
      break;
  }

  return (
    <>
      <View style={header.bottomNavDivider} />
      <TouchableOpacity style={buttons.bottomNav} onPress={onPress}>
        <FontAwesome name={icon} size={18} color="#fff" />
        <Text style={buttons.textNav}>{label}</Text>
      </TouchableOpacity>
    </>
  );
};
