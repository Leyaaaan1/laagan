import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const checkpointModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surfaceDark,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlayCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 50,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkpointIcon: {
    fontSize: fontSize.h3,
    marginRight: spacing.sm,
  },
  checkpointTitleContainer: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  checkpointCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  arriverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arriverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  arriverInitial: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  arriverInfo: {
    flex: 1,
  },
  arriverUsername: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  arriverTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // ── Status banners ────────────────────────────
  bannerWarning: {
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  bannerSuccess: {
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.25)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  bannerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerWarningText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: '#ef4444',
  },
  bannerSuccessTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#4CAF50',
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 50,
  },
  bannerButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  bannerButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  bannerButtonOutline: {
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  bannerButtonDisabled: {
    opacity: 0.5,
  },
  bannerButtonSuccessText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.white,
  },
  bannerButtonDangerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: '#ef4444',
  },
  bannerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerDividerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // ── Forbidden / not-a-participant ─────────────
  forbiddenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  forbiddenTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  forbiddenText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Footer pill (matches action bar style) ────
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceDark,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.92)',
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  footerPillDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  footerSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 50,
  },
  footerSegmentClose: {
    backgroundColor: colors.primary,
  },
  footerSegmentText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.white,
  },
});

export default checkpointModalStyles;
