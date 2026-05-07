


import {StyleSheet} from 'react-native';
import spacing from '../tokens/spacing';
import colors from '../tokens/colors';
import {fontSize, fontWeight} from '../tokens/typography';

const authValidationStyles = StyleSheet.create({
  // ── Validation container ─────────────────────
  container: {
    width: 280,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  // ── Each rule row ────────────────────────────
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },

  // ── Indicator dot ────────────────────────────
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  dotPending: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dotPassed: {
    backgroundColor: colors.success ?? '#22c55e',
    borderColor: colors.success ?? '#22c55e',
  },
  dotFailed: {
    backgroundColor: colors.error ?? '#ef4444',
    borderColor: colors.error ?? '#ef4444',
  },

  // ── Rule label text ──────────────────────────
  ruleText: {
    fontSize: fontSize.xs ?? 11,
    fontWeight: fontWeight.medium ?? '500',
  },
  ruleTextPending: {
    color: 'rgba(255,255,255,0.35)',
  },
  ruleTextPassed: {
    color: colors.success ?? '#22c55e',
  },
  ruleTextFailed: {
    color: colors.error ?? '#ef4444',
  },

  // ── Input border states ──────────────────────
  inputDefault: {
    // no override — use your existing inputs.auth
  },
  inputSuccess: {
    borderColor: colors.success ?? '#22c55e',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.error ?? '#ef4444',
    borderWidth: 1.5,
  },

  // ── Field wrapper (input + checklist together) ─
  fieldBlock: {
    marginBottom: spacing.sm,
  },
});

export default authValidationStyles;
