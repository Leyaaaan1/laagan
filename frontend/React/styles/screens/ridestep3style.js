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

  // Drag handle touchable wrapper
  dragHandleTouchable: {
    alignItems: 'center',
    paddingVertical: 8,
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

  // ─── BOTTOM ACTIONS ROW ─────────────────────────────────

  bottomActionsRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
  },

  // Flex-1 compact variant for action buttons inside the bottom actions row
  actionBtnFlex: {
    flex: 1,
    paddingVertical: 10,
  },

  // Confirm stop button (green)
  confirmStopBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  confirmStopBtnDisabled: {
    opacity: 0.5,
  },

  // ─── INSTRUCTION PILL (stop placement overlay) ───────────

  instructionPill: {
    position: 'absolute',
    bottom: '55%',
    left: 12,
    right: 12,
    zIndex: 45,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  instructionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  instructionPillText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  instructionPillPrompt: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── FLOATING NAV ────────────────────────────────────────

  floatingNavModeLabel: {
    color: '#1a1a1a',
  },

  floatingNavBackText: {
    fontSize: 14,
  },

  floatingNavCreateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  // ─── SEARCH CARD ─────────────────────────────────────────

  searchClearBtn: {
    padding: 4,
    marginRight: 8,
  },

  searchLoadingRow: {
    marginTop: 12,
  },

  routeLoadingRow: {
    marginTop: 8,
  },

  routeLoadingText: {
    color: '#1e40af',
  },

  searchResultsList: {
    maxHeight: 220,
  },

  searchResultIconWrapper: {
    width: 20,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── WEBVIEW ─────────────────────────────────────────────

  webView: {
    flex: 1,
  },

  // ─── BOTTOM SHEET SCROLLVIEW ─────────────────────────────

  bottomSheetScrollView: {
    flex: 1,
  },

  // ─── LOCATION SUGGESTION MODAL — STARTING POINT CHOOSER ──

  // Full-screen overlay for the starting point suggestion flow
  suggestionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },

  suggestionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  suggestionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textDisabled,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  suggestionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },

  suggestionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },

  // Each starting point option card
  startingOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDark,
    marginBottom: spacing.sm,
  },

  // Selected state: highlight border with primary color
  startingOptionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha10,
  },

  startingOptionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  startingOptionIconWrapperSelected: {
    backgroundColor: colors.primary,
  },

  startingOptionTextWrapper: {
    flex: 1,
  },

  startingOptionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  startingOptionName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },

  startingOptionCheckWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  startingOptionCheckWrapperSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  suggestionConfirmBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  suggestionConfirmBtnDisabled: {
    opacity: 0.45,
  },

  suggestionConfirmBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  suggestionDismissBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  suggestionDismissBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});

export default ridestep3style;
