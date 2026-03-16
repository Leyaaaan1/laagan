// ─────────────────────────────────────────────
// base/buttons.js
// Every button variant in the app, in one place.
// Use buttonText alongside any button style for the label.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const buttons = StyleSheet.create({

  // ── Primary (red, filled) ────────────────────
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Pill variant (rounded full) ──────────────
  pill: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Icon circle button ───────────────────────
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGhost: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSurface: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // ── Outline ──────────────────────────────────
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha10,
  },
  outlinePill: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha10,
  },

  // ── Ghost / transparent ──────────────────────
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── White ────────────────────────────────────
  white: {
    backgroundColor: colors.white,
    borderRadius: 25,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // ── Danger (red, for destructive actions) ────
  danger: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Success ──────────────────────────────────
  success: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Back button ──────────────────────────────
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.primaryAlpha20,
  },

  // ── Bottom nav button ────────────────────────
  bottomNav: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },

  // ── Row button (icon + text side by side) ────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
  },

  // ── Disabled state (overlay on any button) ───
  disabled: {
    opacity: 0.5,
  },

  // ── Text styles for buttons ──────────────────
  textPrimary: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
  },
  textSm: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },
  textMd: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },
  textDark: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
  },
  textNav: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    marginLeft: spacing.sm,
  },
});

export default buttons;
