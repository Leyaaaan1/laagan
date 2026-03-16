// ─────────────────────────────────────────────
// screens/rideRoutes.js
// ONLY styles unique to RideRoutesPage.
// Everything reusable lives in base/ or components/.
//
// Usage in RideRoutesPage.jsx:
//   import rideRoutesStyles from '../styles/screens/rideRoutes';
//   import mapStyles from '../styles/components/mapStyles';
//   import images from '../styles/base/images';
//   import cards from '../styles/base/cards';
// ─────────────────────────────────────────────

import { StyleSheet, StatusBar, Dimensions } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const { width, height } = Dimensions.get('window');

const rideRoutes = StyleSheet.create({

  // ── Screen root ──────────────────────────────
  scrollView: {
    flex: 1,
    backgroundColor: colors.black,
  },

  // ── Gradient header ───────────────────────────
  headerGradient: {
    paddingTop: (StatusBar.currentHeight || 24) + 16,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },

  // ── Route status pill ─────────────────────────
  routeStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAlpha20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ── Route details row (start → end) ───────────
  routeDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  routePointText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semi,
    textAlign: 'center',
  },
  routeArrow: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: fontWeight.bold,
  },

  // ── Switch button (toggle start/end image) ────
  switchButton: {
    backgroundColor: colors.primaryAlpha20,
    paddingVertical: spacing.sm,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  switchButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },

  // ── Image section ─────────────────────────────
  imageSection: {
    backgroundColor: colors.black,
    paddingBottom: 10,
  },
  imagesList: {
    paddingHorizontal: 12,
  },

  // ── Map section ───────────────────────────────
  mapSection: {
    backgroundColor: colors.black,
  },
  mapContainer: {
    paddingHorizontal: spacing.md,
  },

  // ── Stop points section ───────────────────────
  stopPointsSection: {
    paddingHorizontal: spacing.md,
  },
  stopPointsList: {
    marginTop: spacing.sm,
  },

  // ── Empty stops state ────────────────────────
  emptyStopsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  emptyStopsIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyStopsText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },
});

export default rideRoutes;
