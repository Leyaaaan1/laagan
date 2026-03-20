// ─────────────────────────────────────────────
// components/rideCard.js
// Styles specific to the ride list item card.
// Used in RidesList and UnifiedRides.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const rideCard = StyleSheet.create({

  // ── Container ────────────────────────────────
  container: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },

  // ── Location header ───────────────────────────
  locationName: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  // ── ID row ────────────────────────────────────
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5,
  },
  idText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },

  // ── Name + type row ───────────────────────────
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rideName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },

  // ── Route row ─────────────────────────────────
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  routePointText: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    marginLeft: 5,
    flexShrink: 1,
  },

  // ── Date ──────────────────────────────────────
  dateText: {
    marginTop: spacing.sm,
    color: '#aaa',
    fontSize: fontSize.sm,
  },

  // ── Creator ───────────────────────────────────
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  creatorText: {
    marginLeft: 5,
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  // ── Map image ─────────────────────────────────
  mapImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // ── Description ───────────────────────────────
  description: {
    marginTop: 12,
    color: '#ccc',
    fontStyle: 'italic',
    fontSize: fontSize.sm,
  },

  // ── Footer row ───────────────────────────────
  footerContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

export default rideCard;
