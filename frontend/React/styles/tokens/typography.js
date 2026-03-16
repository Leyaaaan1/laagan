// ─────────────────────────────────────────────
// tokens/typography.js
// All font sizes, weights, and line heights.
// Use these instead of hardcoding fontSize/fontWeight everywhere.
// ─────────────────────────────────────────────

import colors from './colors';

// ── Size Scale ──────────────────────────────────
export const fontSize = {
  xs:   10,
  sm:   12,
  md:   14,
  base: 15,
  lg:   16,
  xl:   18,
  xxl:  20,
  h3:   22,
  h2:   24,
  h1:   28,
};

// ── Weight Scale ────────────────────────────────
export const fontWeight = {
  regular: '400',
  medium:  '500',
  semi:    '600',
  bold:    '700',
  black:   '800',
};

// ── Ready-to-use text style objects ─────────────
// Spread these directly into your StyleSheet definitions.
// e.g.  myText: { ...typography.body, color: colors.textSecondary }

const typography = {
  // Headings
  h1: {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
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
  },

  // Body
  body: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyMd: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    color: colors.textPrimary,
  },

  // Labels & captions
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },

  // Emphasis
  bold: {
    fontWeight: fontWeight.bold,
  },
  semi: {
    fontWeight: fontWeight.semi,
  },

  // Special
  italic: {
    fontStyle: 'italic',
  },
  mono: {
    fontFamily: 'monospace',
  },
};

export default typography;
