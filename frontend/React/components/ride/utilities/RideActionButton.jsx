import React from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import rideStep4Styles from '../../../styles/screens/rideStep4';

import {RIDE_STATUS} from '../hooks/useRideStatus';
import buttons from '../../../styles/base/buttons';
import header from '../../../styles/base/header';

// ─────────────────────────────────────────────────────────────────────────────
// Navbar action button  (top-right of the header)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rules:
 *  - "Start Ride"   → owner only, ride NOT yet started
 *  - "Join Ride"    → non-owner who has NOT joined (active) or already joined
 *                     (disabled/lowered opacity)
 *  - "View"         → ride is ACTIVE or PERSONAL_FINISHED, visible to everyone
 */
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

  const isActive =
    rideStatus === RIDE_STATUS.ACTIVE ||
    rideStatus === RIDE_STATUS.PERSONAL_FINISHED;
  const isFinished = rideStatus === RIDE_STATUS.FINISHED;

  // ── Owner ─────────────────────────────────────────────────────────────────
  if (isOwner) {
    if (isActive || isFinished) {
      // Ride in progress or done — show View (owner can always view)
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

    // NOT_STARTED → Start Ride button
    return (
      <TouchableOpacity style={rideStep4Styles.startButton} onPress={onStart}>
        <FontAwesome name="play" size={16} color="#fff" />
      </TouchableOpacity>
    );
  }

  // ── Participant ───────────────────────────────────────────────────────────

  // View: ride is active (or user already finished their leg)
  if (isActive && hasJoined) {
    return (
      <TouchableOpacity
        style={[rideStep4Styles.joinButton, {backgroundColor: '#2196F3'}]}
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

  // Already joined but ride not started yet — show disabled Join button
  if (hasJoined) {
    return (
      <TouchableOpacity
        style={[rideStep4Styles.joinButton, {opacity: 0.45}]}
        disabled={true}>
        <FontAwesome
          name="check-circle"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>Joined</Text>
      </TouchableOpacity>
    );
  }

  // Pending approval
  if (hasPendingRequest) {
    return (
      <TouchableOpacity
        style={[
          rideStep4Styles.joinButton,
          {opacity: 0.6, backgroundColor: '#ffa500'},
        ]}
        disabled={true}>
        <FontAwesome
          name="hourglass-half"
          size={14}
          color="#fff"
          style={{marginRight: 6}}
        />
        <Text style={rideStep4Styles.joinButtonText}>Pending</Text>
      </TouchableOpacity>
    );
  }

  // Default: not joined, ride open — Join Ride
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
