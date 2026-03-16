// ─────────────────────────────────────────────
// base/badges.js
// Status badges, ride type badges, chips, tags.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const badges = StyleSheet.create({

  // ── Base badge ───────────────────────────────
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Primary (red) ────────────────────────────
  primary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  primaryText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ── Outline primary ──────────────────────────
  outlinePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAlpha20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlinePrimaryText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },

  // ── Status dot ───────────────────────────────
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  dotSuccess: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },

  // ── Active / inactive ────────────────────────
  active: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  activeText: {
    color: '#27ae60',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    marginLeft: spacing.xs,
  },
  inactive: {
    backgroundColor: colors.textDisabled,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  inactiveText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // ── Ride type badge ──────────────────────────
  rideType: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Rider type badge (header) ────────────────
  riderTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  riderTypeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    opacity: 0.9,
  },

  // ── Chip / tag ───────────────────────────────
  chip: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  chipSmall: {
    backgroundColor: '#f1f3f4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    minHeight: 28,
  },
  chipSmallText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#5f6368',
  },

  // ── Map / section badge ──────────────────────
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  sectionBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  countBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  countBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // ── Owner badge ──────────────────────────────
  owner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  ownerText: {
    color: '#fbbf24',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
});

export default badges;
