// captureRideSnapshot.js
import {captureRef} from 'react-native-view-shot';

// In-flight guard — prevents double-capture if called twice quickly
const captureInFlight = new Set();

/**
 * Captures a native screenshot of the view pointed to by `containerRef`.
 * Returns { skipped, reason? } or { skipped: false, snapshotUri }.
 *
 * No AsyncStorage — caller owns the URI and decides what to do with it.
 */
export async function captureRideSnapshot({containerRef, generatedRidesId}) {
  if (!generatedRidesId) {
    return {skipped: true, reason: 'NO_RIDE_ID'};
  }

  if (captureInFlight.has(generatedRidesId)) {
    return {skipped: true, reason: 'IN_FLIGHT'};
  }

  if (!containerRef?.current) {
    return {skipped: true, reason: 'NO_CONTAINER'};
  }

  captureInFlight.add(generatedRidesId);

  try {
    // 'data-uri' → "data:image/png;base64,..." — no temp file, no permissions needed.
    // react-native-view-shot renders exactly what is on screen (tiles included),
    // bypassing the WebView canvas cross-origin restriction entirely.
    const snapshotUri = await captureRef(containerRef, {
      format: 'png',
      quality: 0.9,
      result: 'data-uri',
    });

    return {skipped: false, snapshotUri};
  } catch (e) {
    console.warn('[captureRideSnapshot] capture failed:', e);
    return {skipped: true, reason: 'CAPTURE_ERROR'};
  } finally {
    captureInFlight.delete(generatedRidesId);
  }
}
