// ─────────────────────────────────────────────────────────────────────────────
// styles/profileStyles.js
//
// All styles for the RiderProfile and RiderProfileEditScreen.
// Follows the same token/base pattern as text.js, layout.js, cards.js, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const profileStyles = StyleSheet.create({

  // ── Screen ────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollContent: {
    paddingBottom: spacing.lg * 2,
  },

  // ── Hero banner ───────────────────────────────────────────────────────
  heroBanner: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.lg + 30, // extra to sit behind avatar
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },

  // ── Avatar ────────────────────────────────────────────────────────────
  avatarWrapper: {
    marginTop: -(spacing.lg + 30),
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  // ── Profile header block ──────────────────────────────────────────────
  profileHeaderCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  inlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  displayName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  // ── Rider type badges ─────────────────────────────────────────────────
  badgeRow: {
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Section card ──────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionIndicator: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Info row inside a section ─────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    width: 90,
    marginTop: 2,
  },
  infoValue: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  infoValueMuted: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // ── Bio ───────────────────────────────────────────────────────────────
  bioText: {
    fontSize: fontSize.base,
    color: '#ccc',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  bioEmpty: {
    fontSize: fontSize.base,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },

  // ── Edit form inputs ──────────────────────────────────────────────────
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  inputField: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.lg,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  inputFieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputFieldMultiline: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.base,
    color: colors.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },

  // ── Type toggle chips (edit screen) ──────────────────────────────────
  typeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  typeChip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDark,
  },
  typeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryAlpha10,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  typeChipTextActive: {
    color: colors.primary,
  },

  // ── Timestamps ────────────────────────────────────────────────────────
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // ── Loading / error ───────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.black,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

export default profileStyles;