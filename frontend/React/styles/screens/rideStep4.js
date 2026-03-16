// ─────────────────────────────────────────────
// screens/rideStep4.js
// ONLY styles unique to RideStep4 screen.
// Everything reusable lives in base/ or components/.
//
// Usage in RideStep4.jsx:
//   import rideStep4Styles from '../styles/screens/rideStep4';
//   import cards from '../styles/base/cards';
//   import header from '../styles/base/header';
//   import buttons from '../styles/base/buttons';
//   import images from '../styles/base/images';
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const rideStep4 = StyleSheet.create({

  // ── Screen root ──────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  fadeContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },

  // ── Join button (header right) ───────────────
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ── Start button (header right, icon only) ───
  startButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default rideStep4;
