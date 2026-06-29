// ─────────────────────────────────────────────
// screens/riderPage.js
// ONLY styles unique to RiderPage.
// Everything reusable lives in base/ or components/.
//
// Usage in RiderPage.jsx:
//   import s from '../styles/screens/riderPage';
//   import header from '../styles/base/header';
//   import layout from '../styles/base/layout';
// ─────────────────────────────────────────────

import {StyleSheet} from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

const riderPage = StyleSheet.create({
  // ── Navbar ───────────────────────────────────
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },

  // ── Hero / greeting ────────────────────────────
  heroContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroGreeting: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  // ── Stats strip (rides joined / created / distance / last ride) ─────
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWell: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  lastRideStrip: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lastRideText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  lastRideTextStrong: {
    color: colors.white,
    fontWeight: fontWeight.semi,
  },

  // ── Section headers ───────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    padding: 5,
  },
  sectionAction: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  actionCardPrimary: {
    flex: 1, // makes both equal width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
  },

  hiddenScanner: {
    position: 'absolute',
    opacity: 0, // keeps logic but removes layout impact
  },
  actionLabel: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.1,
    marginTop: spacing.sm,
  },
  actionSubLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  actionSubLabelLight: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // ── Search card ───────────────────────────────
  searchSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    paddingVertical: 14,
  },
  searchJoinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  searchJoinLabel: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  searchHelperText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
    marginLeft: 4,
  },

  // ── Active rides section ──────────────────────
  ridesSection: {
    marginBottom: spacing.lg,
    padding: 10,
  },
  rideCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  rideCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rideCardName: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  rideCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 6,
  },
  rideCardMetaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  rideCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rideCardDateText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  rideCardViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rideCardViewBtnText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // ── Status badge variants ─────────────────────
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusUpcoming: {
    backgroundColor: colors.primaryAlpha15,
  },
  statusFinished: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // ── Empty state (no rides yet) ────────────────
  emptyStateCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyStateIconWell: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryAlpha15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 19,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // ── Skeleton / loading card ────────────────────
  rideCardSkeleton: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Recent activity ────────────────────────────
  activityCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  activityRowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityIconWell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 18,
  },
  activityTextStrong: {
    color: colors.white,
    fontWeight: fontWeight.semi,
  },
  activityEmptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default riderPage;
