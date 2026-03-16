// ─────────────────────────────────────────────
// base/cards.js
// Card containers, info cards, hero cards, route cards.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const cards = StyleSheet.create({

  // ── Base card ────────────────────────────────
  base: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Elevated card ────────────────────────────
  elevated: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },

  // ── Hero card (large feature card) ───────────
  hero: {
    backgroundColor: '#111111',
    margin: 8,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },

  // ── Info card (small stat/data card) ─────────
  info: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  infoValue: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    fontWeight: fontWeight.semi,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },

  // ── Description card ─────────────────────────
  description: {
    borderRadius: 8,
    padding: spacing.sm,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    fontStyle: 'italic',
  },

  // ── Route card ───────────────────────────────
  route: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routePointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  routePointLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  routePointText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },
  routeConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    paddingVertical: spacing.sm,
  },
  routeConnectorLine: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderLight,
    marginRight: 8,
  },

  // ── Active ride card ─────────────────────────
  activeRide: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  activeRideTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    marginBottom: spacing.sm,
  },
  activeRideName: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
  },
  activeRideMeta: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    justifyContent: 'space-between',
  },
  activeRideMetaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  activeRideEmpty: {
    color: colors.textDisabled,
    fontSize: fontSize.md,
  },

  // ── Ride list item card ───────────────────────
  rideItem: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  rideItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rideItemTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },

  // ── Section wrapper ───────────────────────────
  section: {
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
});

export default cards;
