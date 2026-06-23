// captureRideSnapshot.js
import {captureRef} from 'react-native-view-shot';

// In-flight guard — prevents double-capture if called twice quickly
const captureInFlight = new Set();

/**
 * Captures a native screenshot of the view pointed to by `containerRef`.
 *
 * Returns one of:
 *   { skipped: true,  reason: string }          — capture was skipped
 *   { skipped: false, snapshotUri: string }      — data-uri PNG, fully transparent background
 *
 * Transparency notes
 * ──────────────────
 * • format: 'png'   — PNG supports an alpha channel; JPEG does not.
 * • result: 'data-uri' — returns "data:image/png;base64,…"; no temp file,
 *   no storage permissions needed, works on both iOS and Android.
 * • The View/Svg wrapper in RideSnapshotView must have
 *   backgroundColor: 'transparent' (not omitted — on Android the default
 *   background is white, which would bleed through into the capture).
 * • quality is ignored for PNG (it only affects JPEG lossy compression)
 *   but is kept at 1 for forward-compatibility.
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
    const snapshotUri = await captureRef(containerRef, {
      format: 'png', // ← PNG preserves alpha channel (transparent BG)
      quality: 1, // ignored for PNG, set for clarity
      result: 'data-uri', // "data:image/png;base64,…" — no temp file needed
      // useRenderInContext: false (default) — use the platform's native
      // screenshot path; sufficient for an off-screen SVG view.
    });

    return {skipped: false, snapshotUri};
  } catch (e) {
    console.warn('[captureRideSnapshot] capture failed:', e);
    return {skipped: true, reason: 'CAPTURE_ERROR'};
  } finally {
    captureInFlight.delete(generatedRidesId);
  }
}
