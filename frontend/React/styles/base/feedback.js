// ─────────────────────────────────────────────
// base/feedback.js
// Loading, error, and empty state styles.
// Use these everywhere instead of recreating them per screen.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const feedback = StyleSheet.create({

  // ── Loading ──────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginLeft: spacing.sm,
    marginTop: 10,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginBottom: 12,
  },

  // ── Inline loading (inside cards) ────────────
  loadingInline: {
    padding: 20,
    alignItems: 'center',
  },

  // ── Fullscreen loading overlay ───────────────
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // ── Error ────────────────────────────────────
  errorContainer: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
  },
  errorContainerFull: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginVertical: 12,
  },
  errorTextPrimary: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: 12,
  },

  // ── Empty state ──────────────────────────────
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#ddd',
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // ── Image loading placeholder ────────────────
  imagePlaceholder: {
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
});

export default feedback;
