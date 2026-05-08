// ─────────────────────────────────────────────
// styles/screens/ridestep3style.js
//
// Redesigned RideStep3 layout StyleSheet (COMPACT VERSION):
// - Smaller text sizes
// - Reduced spacing and padding
// - Compact containers
// ─────────────────────────────────────────────

import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const ridestep3style = StyleSheet.create({
  // ─── CONTAINER & LAYOUT ─────────────────────────────────

  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },

  // MAP SECTION (top 50%)
  mapContainer: {
    flex: 1,
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },

  // Search bar overlay (floats over map)
  searchBar: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: fontSize.sm,
    color: colors.textDark,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  // Top-left back button
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 101,
  },

  // Top-right create button
  createTopButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 101,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  createTopButtonText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
  },

  // ─── BOTTOM SHEET PANEL ─────────────────────────────────

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  // Drag handle bar at top of sheet
  dragHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textDisabled,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  // Collapse/expand chevron button
  collapseButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── ROUTE TIMELINE ─────────────────────────────────────

  timelineWrapper: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  // LEFT COLUMN: vertical connector line + nodes
  timelineLeft: {
    width: 36,
    alignItems: 'center',
    position: 'relative',
  },

  // Vertical line connecting all nodes
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#444444',
  },

  // START node (green filled circle with white border)
  nodeStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // STOP nodes (brand red circle with white number)
  nodeStop: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // END node (red square marker)
  nodeEnd: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Text inside stop nodes (number label)
  nodeLabel: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },

  // ─── ROUTE TIMELINE - RIGHT COLUMN ──────────────────────

  timelineRight: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },

  // Small label above location name ("Start" / "Stop N" / "End")
  rowLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 2,
  },

  // Main location name (white, bold)
  rowLocationName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },

  // "Change" text button (brand red, right-aligned) on start/end rows
  rowChangeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  rowChangeBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
  },

  // Red × icon (remove button) on stop rows
  rowRemoveBtn: {
    padding: spacing.xs,
    marginLeft: 'auto',
  },

  rowRemoveBtnText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // ─── DISTANCE CHIP ──────────────────────────────────────

  distanceChip: {
    alignSelf: 'center',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  distanceChipText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: fontWeight.semi,
  },

  // ─── STOP POINTS HEADER ─────────────────────────────────

  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  stopHeaderLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  stopBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 28,
    alignItems: 'center',
  },

  stopBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // ─── ADD STOP BUTTON ────────────────────────────────────

  addStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.sm,

    backgroundColor: colors.primaryAlpha10,
  },

  addStopBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ─── CREATE RIDE BUTTON (bottom) ────────────────────────

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  createBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // ─── ROUTE ROW WRAPPER ──────────────────────────────────

  routeRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  routeRowContentWrapper: {
    flex: 1,
  },

  // ─── HELPER TEXT STYLES ─────────────────────────────────

  emptyStateText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
    marginVertical: spacing.md,
  },

  errorText: {
    color: colors.error,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },

  successText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
});

export default ridestep3style;
