// ─────────────────────────────────────────────
// base/layout.js
// Reusable container, flex, and screen layout styles.
// These have NO screen-specific logic — safe to use anywhere.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';

const layout = StyleSheet.create({

  // ── Root Screens ────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  screenDark: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },
  screenSurface: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // ── Flex Helpers ────────────────────────────
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowAround: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInline: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Padding Helpers ─────────────────────────
  padSm: { padding: spacing.sm },
  padMd: { padding: spacing.md },
  padLg: { padding: spacing.lg },
  padHorizSm: { paddingHorizontal: spacing.sm },
  padHorizMd: { paddingHorizontal: spacing.md },
  padHorizLg: { paddingHorizontal: spacing.lg },
  padVertSm: { paddingVertical: spacing.sm },
  padVertMd: { paddingVertical: spacing.md },

  // ── Margin Helpers ───────────────────────────
  marginBottomSm: { marginBottom: spacing.sm },
  marginBottomMd: { marginBottom: spacing.md },
  marginBottomLg: { marginBottom: spacing.lg },
  marginTopSm:    { marginTop: spacing.sm },
  marginTopMd:    { marginTop: spacing.md },

  // ── Section / Content Blocks ─────────────────
  section: {
    marginBottom: spacing.md,
  },
  contentPad: {
    padding: spacing.md,
  },
  scrollContent: { padding: 12, flex: 1 },


  // ── Bottom Bar Area ──────────────────────────
  bottomContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomBar: {
    height: 56,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.tibetanRed800,
  },

  // ── Dividers ────────────────────────────────
  dividerHoriz: {
    height: 1,
    backgroundColor: colors.border,
  },
  dividerVert: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
  },

  // ── Absolute fill ───────────────────────────
  absoluteFill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },

  // ── Location / form group ────────────────────
  locationContainer: {
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});

export default layout;
