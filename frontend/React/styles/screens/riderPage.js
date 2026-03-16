// ─────────────────────────────────────────────
// screens/riderPage.js
// ONLY styles unique to RiderPage.
// Everything reusable lives in base/ or components/.
//
// Usage in RiderPage.jsx:
//   import riderPageStyles from '../styles/screens/riderPage';
//   import header from '../styles/base/header';
//   import buttons from '../styles/base/buttons';
//   import layout from '../styles/base/layout';
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const riderPage = StyleSheet.create({

  // ── My Rides bottom button ────────────────────
  myRidesButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  myRidesButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
  },
});

export default riderPage;
