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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'visible',
  },

  heroGlass: {
    backgroundColor: 'rgba(17, 17, 17, 0.8)',
    backdropFilter: 'blur(10px)',
    margin: 8,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },

  heroDistanceBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(140, 35, 35, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(140, 35, 35, 0.3)',
  },

  heroDistanceText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    letterSpacing: 0.2,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
    maxWidth: '85%',
  },
  heroChipsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(136, 136, 136, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(136, 136, 136, 0.15)',
  },

  heroChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  routeContainer: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },

  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: colors.white,
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
    color: colors.white,
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
    borderRadius: 12,
    padding: 12,
    height: 150, // ← Add this fixed height
    backgroundColor: colors.borderLight, // ← Optional: add background for clarity
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
    marginVertical: spacing.sm,
  },

  routePointDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },

  routePointStart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  routePointEnd: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },

  routePointLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },

  routePointTextLarge: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    lineHeight: 18,
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

  routeDottedConnector: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 4,
    marginLeft: 11,
  },

  routeDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(140, 35, 35, 0.4)',
  },

  descriptionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },

  descriptionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
  },

  descriptionBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: 180,
  },

  descriptionText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0.2,
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
