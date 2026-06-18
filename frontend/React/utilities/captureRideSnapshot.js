
import {captureRef} from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';

const captureInFlight = new Set();

const storageKey = generatedRidesId => `routeSnapshot:${generatedRidesId}`;

// Call this from PersonalSummaryView (or anywhere else) to read back a
// previously-captured snapshot for a ride. Returns null if none exists yet.
export async function getLocalRouteSnapshot(generatedRidesId) {
  if (!generatedRidesId) return null;
  try {
    return await AsyncStorage.getItem(storageKey(generatedRidesId));
  } catch (e) {
    return null;
  }
}

export async function captureRideSnapshot({containerRef, generatedRidesId}) {
  if (!generatedRidesId) {
    return {skipped: true, reason: 'NO_RIDE_ID'};
  }

  const existing = await getLocalRouteSnapshot(generatedRidesId);
  if (existing) {
    // Idempotency guard — a snapshot already exists on this device for this
    // ride, never recapture.
    return {skipped: true, reason: 'ALREADY_CAPTURED', snapshotUri: existing};
  }

  if (captureInFlight.has(generatedRidesId)) {
    return {skipped: true, reason: 'IN_FLIGHT'};
  }

  if (!containerRef?.current) {
    return {skipped: true, reason: 'NO_CONTAINER'};
  }

  captureInFlight.add(generatedRidesId);

  try {
    // 'data-uri' gives back a ready-to-render string
    // ("data:image/png;base64,...") with no temp-file management needed.
    const dataUri = await captureRef(containerRef, {
      format: 'png',
      quality: 0.9,
      result: 'data-uri',
    });

    await AsyncStorage.setItem(storageKey(generatedRidesId), dataUri);

    return {skipped: false, snapshotUri: dataUri};
  } finally {
    captureInFlight.delete(generatedRidesId);
  }
}