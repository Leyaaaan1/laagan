// File: frontend/React/styles/screens/finishedRideStyles.js

import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const finishedRideStyles = StyleSheet.create({
  // ── Screen root ──────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },

  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  backButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero / Summary Card ───────────────────────
  heroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  heroAccent: {
    height: 3,
    width: '100%',
  },

  heroPadding: {
    padding: spacing.lg,
  },

  rideName: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },

  // ── Stats Row ────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    marginHorizontal: 3,
  },

  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },

  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  statUnit: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },

  // ── Divider ───────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },

  // ── Time Row ──────────────────────────────────
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeItem: {
    flex: 1,
  },

  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  timeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  timeDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  timeArrow: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },

  // ── Section ──────────────────────────────────
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },

  sectionBadge: {
    backgroundColor: 'rgba(140,35,35,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },

  sectionBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  // ── Participants List ────────────────────────
  participantsList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  participantItemLast: {
    borderBottomWidth: 0,
  },

  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  participantInitial: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  participantInfo: {
    flex: 1,
  },

  participantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },

  participantCheckpoints: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  completionBadge: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgb(255 255 255)',
  },

  completionBadgeFull: {
    backgroundColor: 'rgba(76,175,80,0.18)',
  },

  completionPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  completionPercentFull: {
    color: '#4CAF50',
  },

  // ── Checkpoint Timeline ──────────────────────
  timelineContainer: {
    paddingLeft: 8,
  },

  timelineRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },

  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },

  timelineIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(140,35,35,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
    zIndex: 1,
  },

  timelineIconWrapActive: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
  },

  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },

  timelineLineActive: {
    backgroundColor: 'rgba(140,35,35,0.4)',
  },

  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginBottom: spacing.md,
  },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xs,
  },

  timelineHeaderActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(140,35,35,0.06)',
  },

  timelineName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  timelineCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: fontWeight.semi,
  },

  timelineArrivers: {
    paddingLeft: spacing.sm,
    gap: 4,
  },

  arriverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  arriverAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.tibetanRed200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  arriverInitial: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },

  arriverInfo: {
    flex: 1,
  },

  arriverUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },

  arriverTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  arriverCheck: {
    marginLeft: spacing.sm,
  },

  // ── Empty States ─────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 1.5,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  emptySubText: {
    fontSize: fontSize.sm,
    color: colors.textMuted || colors.textSecondary,
    marginTop: spacing.xs,
  },

  noDataText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // ── Error state ───────────────────────────────
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  backButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },

  backButtonText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semi,
  },

  // ── Personal Badge ────────────────────────────
  personalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  personalBadgeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    fontWeight: fontWeight.medium,
  },

  // ── Done Button ──────────────────────────────
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  doneButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.2,
  },
});

export default finishedRideStyles;