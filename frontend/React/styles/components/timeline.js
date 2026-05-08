// ─────────────────────────────────────────────
// components/timeline.js
// Google Maps-style vertical timeline for route overview.
// ─────────────────────────────────────────────

import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const timeline = StyleSheet.create({
  // ── Load All Images Button (top-right ghost button) ──
  loadAllButtonContainer: {
    position: 'absolute',
    top: 60,
    right: spacing.md,
    zIndex: 100,
  },
  loadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryAlpha15,
    backgroundColor: colors.primaryAlpha10,
  },
  loadAllButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    letterSpacing: 0.3,
  },

  // ── Timeline Container (main flex layout) ──
  timelineContainer: {
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // ── Timeline row (one stop) ──
  timelineRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: 24,
    minHeight: 100,
  },

  // ── Left Column: Node track (48px wide, absolute positioned line) ──
  nodeColumn: {
    width: 48,
    alignItems: 'center',
    position: 'relative',
  },

  // ── Vertical connector line (inside nodeColumn) ──
  connectorLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1.5,
    width: 3,
    height: '100%',
    backgroundColor: colors.borderLight,
  },

  // ── Node container (holds the circle/icon) ──
  nodeContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  // ── Starting point node (green circle) ──
  startingPointNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // ── Stop node (red circle with number) ──
  stopNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopNodeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.black,
  },

  // ── Ending point node (red pin icon) ──
  endPointNode: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Right Column: Card content (flex) ──
  cardContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },

  // ── Stop Card itself ──
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },

  // ── Card header (label + chevron) ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  // ── Stop type label (STARTING POINT / STOP 1 / ENDING POINT) ──
  stopLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Stop location name ──
  stopName: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semi,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },

  // ── Distance/Duration chip (between stops) ──
  distanceChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryAlpha10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryAlpha15,
  },
  distanceChipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.2,
  },

  // ── Expanded content (images section) ──
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // ── Load Images button (in expanded card) ──
  loadImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryAlpha15,
  },
  loadImagesButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ── Images scroll container ──
  imagesScroll: {
    marginTop: spacing.md,
    height: 140, // Fixed height: 110px image + ~30px caption
  },

  // ── Scroll inner content row ──
  imagesScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
  },

  // ── Image thumbnail ──
  imageThumb: {
    width: 110,
    height: 140,
    marginRight: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  imageThumbImg: {
    width: 110,
    height: 110,
    backgroundColor: colors.surfaceDark,
  },

  // ── Image caption (author) ──
  imageCaption: {
    backgroundColor: colors.surfaceDark,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  imageCaptionText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});

export default timeline;
