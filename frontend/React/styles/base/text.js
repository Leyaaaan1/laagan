// ─────────────────────────────────────────────
// base/text.js
// All reusable text/label styles.
// Built on top of typography tokens.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import { fontSize, fontWeight } from '../tokens/typography';
import spacing from '../tokens/spacing';

const text = StyleSheet.create({

  // ── Headings ────────────────────────────────
  h1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  h2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  h3: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  titleCenter: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.black,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titlePrimary: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // ── Section Labels ───────────────────────────
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  labelLight: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },

  // ── Body ────────────────────────────────────
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyMd: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: 3,
  },
  bodyMuted: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bodyItalic: {
    fontSize: fontSize.base,
    color: '#ccc',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // ── Small / Captions ────────────────────────
  caption: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  captionPrimary: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semi,
  },

  // ── Special ─────────────────────────────────
  primaryAccent: {
    color: colors.primary,
    fontWeight: fontWeight.semi,
    fontSize: fontSize.md,
  },
  white: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xxl,
  },
  muted: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },

  // ── Navbar text ─────────────────────────────
  navbarTextWhite: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  navbarTextDark: {
    color: colors.black,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },

  // ── Status / feedback text ───────────────────
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  successText: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },

  // ── Ride-specific text ───────────────────────
  rideId: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  username: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  riderType: {
    color: colors.white,
    fontSize: fontSize.sm,
    opacity: 0.9,
  },
});

export default text;
