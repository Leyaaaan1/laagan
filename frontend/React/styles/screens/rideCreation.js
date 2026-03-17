// ─────────────────────────────────────────────
// screens/rideCreation.js
// ONLY styles unique to RideStep1/2/3 (ride creation flow).
// Map overlay styles, floating cards, progress bars.
//
// Usage:
//   import rideCreationStyles from '../styles/screens/rideCreation';
//   import inputs from '../styles/base/inputs';
//   import buttons from '../styles/base/buttons';
// ─────────────────────────────────────────────

import { StyleSheet, Dimensions } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const { width: screenWidth } = Dimensions.get('window');

const rideCreation = StyleSheet.create({

  // ── Screen root ──────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mapFill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    height: '100%',
  },

  // ── Floating navbar overlay ───────────────────
  floatingNav: {
    position: 'absolute',
    top: 20,
    left: 12,
    right: 12,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },

  // ── Floating search card ──────────────────────
  searchContainer: {
    position: 'absolute',
    top: 80,
    left: 12,
    right: 12,
    borderRadius: 20,
    elevation: 12,
    zIndex: 50,
  },

  // ── Floating instruction pill ─────────────────
  instructionPill: {
    position: 'absolute',
    top: 135,
    left: 12,
    right: 12,
    elevation: 10,
    zIndex: 45,
  },
  instructionText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    textAlign: 'center',
    letterSpacing: -0.1,
    opacity: 0.9,
  },

  // ── Step 3 floating card ──────────────────────
  step3Container: {
    position: 'absolute',
    top: 120,
    left: 12,
    right: 12,
    borderRadius: 20,
    padding: spacing.md,
    elevation: 12,
    zIndex: 50,
  },
  step3Instructions: {
    top: 260,
    left: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,

    elevation: 10,
    zIndex: 45,
  },

  // ── Bottom floating card ──────────────────────
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: spacing.md,
    elevation: 16,
    zIndex: 40,
  },
  locationInfoCard: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    elevation: 16,
    zIndex: 40,
  },

  // ── Main action buttons (finalize/create) ─────
  mainActionContainer: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    zIndex: 40,
  },
  finalizeButtonWrapper: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Floating action button ────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 50,
  },

  // ── Top row (start + end point cards) ─────────
  topRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 5,
    marginBottom: 3,
  },
  halfWidthCard: {
    flex: 1,
    margin: 3,
    paddingBottom: 3,
  },
  fullWidthCard: {
    flex: 1,
    marginLeft: 3,
    marginRight: 3,
  },

  // ── Modern floating card shell ────────────────
  floatingCard: {
    backgroundColor: 'rgba(58,54,54,0.85)',
    borderRadius: 16,
    padding: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: colors.white,
    padding: spacing.xs,
  },
  cardLocationText: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 30,
  },
  cardChangeButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.85)',
  },
  cardChangeButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Stop points scroll list ───────────────────
  stopScrollView: {
    maxHeight: 140,
  },
  stopScrollContent: {
    paddingBottom: spacing.xs,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.85)',
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  stopName: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  stopCounter: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 24,
    alignItems: 'center',
  },
  stopCounterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  // ── Progress container ────────────────────────
  progressContainer: {
    marginTop: 470,
  },
  progressBarToggleText: {
    color: '#1a1a1a',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    letterSpacing: -0.1,
    marginLeft: spacing.sm,
  },

  // ── Progress step indicators ──────────────────
  progressStepActive:   { backgroundColor: '#4CAF50' },
  progressStepCurrent:  { backgroundColor: colors.primary },
  progressStepInactive: { backgroundColor: '#ccc' },
  progressConnectorActive:   { backgroundColor: '#4CAF50' },
  progressConnectorInactive: { backgroundColor: '#ccc' },

  // ── Nav buttons (back/next) ───────────────────
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8eaed',
    minHeight: 40,
  },
  navButtonNext: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  navButtonBack: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // ── Rider type selector ───────────────────────
  rideTypeOption: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    marginHorizontal: spacing.xs,
  },
  rideTypeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Location name display ─────────────────────
  locationName: {
    color: '#1a1a1a',
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    lineHeight: 25,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  // ── Responsive helpers ────────────────────────
  compactContainer: {
    paddingHorizontal: screenWidth < 375 ? 8 : 12,
  },
  responsiveText: {
    fontSize: screenWidth < 375 ? 13 : 15,
  },
  responsiveButton: {
    paddingHorizontal: screenWidth < 375 ? 16 : 20,
    paddingVertical: screenWidth < 375 ? 10 : 12,
  },
});

export default rideCreation;
