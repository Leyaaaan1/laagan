// ─────────────────────────────────────────────
// base/inputs.js
// Text inputs, search bars, and search result lists.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const inputs = StyleSheet.create({

  // ── Standard input (dark bg, light text) ────
  base: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    fontSize: fontSize.lg,
    color: colors.textDark,
  },

  // ── Modern light input ───────────────────────
  light: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.lg,
    color: colors.textDark,
  },
  lightFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Multiline / description input ───────────
  multiline: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.lg,
    color: colors.textDark,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // ── Location / map search input ──────────────
  location: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e8eaed',
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: '#1a1a1a',
  },
  locationFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fafafa',
  },

  // ── Centered input (forms) ───────────────────
  centered: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.md,
    alignSelf: 'center',
    width: '80%',
    backgroundColor: colors.white,
    fontSize: fontSize.lg,
    color: colors.textDark,
  },

  // ── Auth input ───────────────────────────────
  auth: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.lg,
    color: colors.textDark,
    width: 280,
    marginBottom: spacing.md,
  },

  // ── Search container row ─────────────────────
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e8eaed',
  },
  searchRowFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fafafa',
  },

  // ── Search results dropdown ──────────────────
  resultsList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: spacing.sm,
    maxHeight: 200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultItemLast: {
    borderBottomWidth: 0,
  },
  resultName: {
    color: colors.textDark,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: 3,
  },
  resultAddress: {
    fontSize: fontSize.sm,
    color: '#5f6368',
    lineHeight: 17,
  },

  // ── Search status text ───────────────────────
  searchingText: {
    color: '#5f6368',
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },

  // ── Error state ──────────────────────────────
  errorBorder: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
});

export default inputs;
