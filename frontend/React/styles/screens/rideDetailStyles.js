import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const rideDetailStyles = StyleSheet.create({

  viewFloatingHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  viewFloatingBackBtn: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 6,
  },
  viewFloatingBackBtnPosition: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },

  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
    backgroundColor: colors.primaryAlpha10,
  },
  prBadgeText: {
    fontSize: fontSize.sm,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.semi,
  },

  viewPrBadgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  viewPrBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
  },
  viewPrBadgeOverlayText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  viewSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  viewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  viewSectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSectionTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  viewSectionBadge: {
    backgroundColor: colors.primaryAlpha15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  viewSectionBadgeText: {
    fontSize: fontSize.xs,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.bold,
  },
  viewMapWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  viewRouteLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  viewRouteLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '47%',
  },
  viewRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewRouteLabelText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  viewRouteMapFill: {
    flex: 1,
  },

  viewChartSection: {
    marginTop: spacing.md,
  },

  // ── caption card ──────────────────────────────
  viewCaptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  viewCaptionText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  viewCaptionMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  viewAddMediaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  viewAddMediaCtaText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  viewLoadingIndicator: {
    flex: 1,
  },
  viewScrollContent: {
    paddingBottom: 2,
  },

  heroContainer: {
    height: 280, // HERO_HEIGHT
    width: '100%',
  },
  heroDark: {
    backgroundColor: colors.surface,
  },
  heroInner: {
    flex: 1,
  },

  // ── upload button ────────────────────────────────
  heroUploadButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroUploadButtonText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semi,
  },

  // ── bottom overlay ────────────────────────────────
  heroBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.md,
  },
  heroRideName: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },

  // ── stats strip ───────────────────────────────────
  heroStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroOverlayStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroOverlayStatIcon: {
    marginBottom: 3,
  },
  heroOverlayStatValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  heroOverlayStatUnit: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.tibetanRed200,
  },
  heroOverlayStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  mediaBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  mediaSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  mediaHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  mediaSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  mediaSheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ── type toggle ───────────────────────────────
  mediaTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  mediaTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mediaTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mediaTypeBtnLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
  },
  mediaTypeBtnLabelActive: {
    color: colors.white,
  },

  // ── pick area ─────────────────────────────────
  mediaPickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mediaPickText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  mediaPickTextSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semi,
  },

  // ── caption ───────────────────────────────────
  mediaCaptionWrap: {
    marginBottom: spacing.md,
  },
  mediaCaptionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  mediaCaptionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  // ── upload button ─────────────────────────────
  mediaUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  mediaUploadBtnDisabled: {
    opacity: 0.45,
  },
  mediaUploadBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  chartSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },

  // ── section header ───────────────────────────
  chartSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chartSectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartSectionTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  chartAvgBadge: {
    backgroundColor: colors.primaryAlpha15,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chartAvgBadgeText: {
    fontSize: fontSize.xs,
    color: colors.tibetanRed200,
    fontWeight: fontWeight.semi,
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chartLegendLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  chartSegmentWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  chartSegmentLast: {
    borderBottomWidth: 0,
  },
  chartSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  chartLabels: {
    width: 90,
  },
  chartFromLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },
  chartToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  chartToArrowIcon: {
    marginRight: 4,
  },
  chartToLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    flex: 1,
  },
  chartTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartBadge: {
    alignItems: 'center',
    width: 46,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  chartBadgeValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  chartBadgeUnit: {
    fontSize: 9,
    color: colors.textMuted,
  },
  chartChevron: {
    width: 14,
    textAlign: 'center',
  },

  // ── expanded detail ───────────────────────────
  chartDetail: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chartDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  chartDetailDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  chartDetailLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  chartDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  chartHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // ════════════════════════════════════════════════════════════════════
  // RideDetailStats.jsx
  // ════════════════════════════════════════════════════════════════════
  statsSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // ── stat card ─────────────────────────────────
  statsCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statsCardWide: {
    flex: 2,
  },
  statsIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statsLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsValue: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statsUnit: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },

  // ── time strip ────────────────────────────────
  statsTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statsTimeItem: {
    flex: 1,
  },
  statsTimeItemRight: {
    alignItems: 'flex-end',
  },
  statsTimeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  statsTimeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statsArrow: {
    paddingHorizontal: spacing.md,
  },
});

export default rideDetailStyles;